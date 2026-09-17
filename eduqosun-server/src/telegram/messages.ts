import { stat } from 'node:fs/promises'
import { Api, type TelegramClient } from 'telegram'
import { CustomFile } from 'telegram/client/uploads.js'
import { generateRandomLong } from 'telegram/Helpers.js'
import { getInputMedia } from 'telegram/Utils.js'
import type { ChatRecord } from '../db.js'
import { AppError, telegramCode } from '../errors.js'
import type { AttachmentDTO, AttachmentKind, HistoryDTO, MessageDTO } from '../types.js'
import { convertToVoice, decodeWaveform, encodeWaveform, rememberSentFile, removeQuietly } from './media.js'
import { displayName, toInputPeer } from './peers.js'

/* ———————————— Telegram xabari → panel xabari ———————————— */

const CAPTION_LIMIT = 1024
const TEXT_LIMIT = 4096
const ALBUM_LIMIT = 10
const PHOTO_LIMIT_BYTES = 10 * 1024 * 1024
const PHOTO_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function mediaUrl(conversationId: string, msgId: number, variant?: 'thumb'): string {
  const base = `/api/telegram/media/${encodeURIComponent(conversationId)}/${msgId}`
  return variant ? `${base}?variant=${variant}` : base
}

function hasThumb(thumbs: Api.TypePhotoSize[] | undefined): boolean {
  return (thumbs ?? []).some((s) => s instanceof Api.PhotoSize || s instanceof Api.PhotoSizeProgressive)
}

function attachmentOf(message: Api.Message, conversationId: string): AttachmentDTO | null {
  const media = message.media
  const id = message.id

  if (media instanceof Api.MessageMediaPhoto && media.photo instanceof Api.Photo) {
    const sizes = media.photo.sizes.filter((s): s is Api.PhotoSize | Api.PhotoSizeProgressive => s instanceof Api.PhotoSize || s instanceof Api.PhotoSizeProgressive)
    const largest = sizes.at(-1)
    return {
      tgId: id,
      kind: 'photo',
      url: mediaUrl(conversationId, id),
      thumbUrl: mediaUrl(conversationId, id, 'thumb'),
      mime: 'image/jpeg',
      width: largest?.w,
      height: largest?.h,
    }
  }

  if (media instanceof Api.MessageMediaDocument && media.document instanceof Api.Document) {
    const doc = media.document
    let kind: AttachmentKind = 'file'
    let name: string | undefined
    let duration: number | undefined
    let width: number | undefined
    let height: number | undefined
    let waveform: number[] | undefined

    for (const attr of doc.attributes) {
      if (attr instanceof Api.DocumentAttributeFilename) name = attr.fileName
      if (attr instanceof Api.DocumentAttributeVideo) {
        kind = 'video'
        duration = attr.duration
        width = attr.w
        height = attr.h
      }
      if (attr instanceof Api.DocumentAttributeAudio) {
        kind = attr.voice ? 'voice' : 'audio'
        duration = attr.duration
        waveform = attr.voice ? decodeWaveform(attr.waveform) : undefined
        if (!name && attr.title) name = [attr.performer, attr.title].filter(Boolean).join(' — ')
      }
      if (attr instanceof Api.DocumentAttributeImageSize && kind === 'file' && PHOTO_MIMES.has(doc.mimeType)) {
        kind = 'photo'
        width = attr.w
        height = attr.h
      }
    }
    if (kind === 'file' && doc.mimeType === 'image/webp') kind = 'photo'

    return {
      tgId: id,
      kind,
      url: mediaUrl(conversationId, id),
      thumbUrl: kind === 'photo' ? mediaUrl(conversationId, id) : hasThumb(doc.thumbs) ? mediaUrl(conversationId, id, 'thumb') : undefined,
      name,
      mime: doc.mimeType,
      size: Number(doc.size.toString()),
      duration,
      width,
      height,
      waveform,
    }
  }

  return null
}

/** Faylsiz maxsus xabarlar uchun qisqa matn */
function placeholderOf(media: Api.TypeMessageMedia | undefined): string {
  if (!media) return ''
  if (media instanceof Api.MessageMediaGeo || media instanceof Api.MessageMediaGeoLive || media instanceof Api.MessageMediaVenue) return '📍 Joylashuv'
  if (media instanceof Api.MessageMediaContact) return `👤 Kontakt: ${[media.firstName, media.lastName].filter(Boolean).join(' ')} ${media.phoneNumber ? `+${media.phoneNumber.replace(/^\+/, '')}` : ''}`.trim()
  if (media instanceof Api.MessageMediaPoll) return `📊 So'rovnoma: ${media.poll.question.text}`
  if (media instanceof Api.MessageMediaDice) return `${media.emoticon} ${media.value}`
  if (media instanceof Api.MessageMediaWebPage || media instanceof Api.MessageMediaEmpty) return ''
  return '📎 Qo‘llab-quvvatlanmaydigan xabar turi'
}

export function toMessageDTO(message: Api.Message, conversationId: string, options: { author?: string; readOutboxMaxId?: number } = {}): MessageDTO {
  const attachment = attachmentOf(message, conversationId)
  const text = message.message || (attachment ? '' : placeholderOf(message.media))
  return {
    id: `tg-${message.id}`,
    tgIds: [message.id],
    albumId: message.groupedId ? message.groupedId.toString() : undefined,
    from: message.out ? 'me' : 'them',
    author: message.out ? undefined : options.author,
    text,
    sentAt: new Date(message.date * 1000).toISOString(),
    editedAt: message.editDate && !message.editHide ? new Date(message.editDate * 1000).toISOString() : undefined,
    read: message.out ? message.id <= (options.readOutboxMaxId ?? 0) : true,
    attachments: attachment ? [attachment] : [],
  }
}

/** Bir albomga tegishli ketma-ket xabarlarni bittaga birlashtiradi */
export function mergeAlbums(messages: MessageDTO[]): MessageDTO[] {
  const result: MessageDTO[] = []
  for (const message of messages) {
    const previous = result.at(-1)
    if (previous && message.albumId && previous.albumId === message.albumId) {
      previous.tgIds.push(...message.tgIds)
      previous.attachments.push(...message.attachments)
      if (!previous.text && message.text) previous.text = message.text
      previous.read = previous.read && message.read
    } else {
      result.push({ ...message, tgIds: [...message.tgIds], attachments: [...message.attachments] })
    }
  }
  return result
}

export async function authorOf(message: Api.Message, chat: ChatRecord): Promise<string | undefined> {
  if (message.out || chat.peerType === 'user') return undefined
  try {
    const sender = message.sender ?? (await message.getSender())
    if (sender) return displayName(sender)
    // Kanal nomidan yozilgan (anonim admin) xabar
    return message.postAuthor ?? chat.title
  } catch {
    return undefined
  }
}

/* ———————————— Tarix ———————————— */

interface DialogState {
  readOutboxMaxId: number
  unread: number
}

async function dialogState(client: TelegramClient, chat: ChatRecord): Promise<DialogState> {
  try {
    const result = await client.invoke(new Api.messages.GetPeerDialogs({ peers: [new Api.InputDialogPeer({ peer: toInputPeer(chat) })] }))
    const dialog = result.dialogs.find((d): d is Api.Dialog => d instanceof Api.Dialog)
    return { readOutboxMaxId: dialog?.readOutboxMaxId ?? 0, unread: dialog?.unreadCount ?? 0 }
  } catch {
    return { readOutboxMaxId: 0, unread: 0 }
  }
}

export async function fetchHistory(client: TelegramClient, chat: ChatRecord, options: { minId?: number; limit?: number }): Promise<HistoryDTO> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200)
  const [list, state] = await Promise.all([
    client.getMessages(toInputPeer(chat), { limit, minId: options.minId ?? 0 }),
    dialogState(client, chat),
  ])
  const ordered = [...list].filter((m): m is Api.Message => m instanceof Api.Message).sort((a, b) => a.id - b.id)
  const messages: MessageDTO[] = []
  for (const message of ordered) {
    messages.push(toMessageDTO(message, chat.conversationId, { author: await authorOf(message, chat), readOutboxMaxId: state.readOutboxMaxId }))
  }
  return { messages: mergeAlbums(messages), unread: state.unread, readOutboxMaxId: state.readOutboxMaxId }
}

/* ———————————— Yuborish ———————————— */

export interface FileMeta {
  width?: number
  height?: number
  duration?: number
  /** Rasmni siqmasdan — fayl sifatida yuborish */
  asFile?: boolean
}

export interface OutgoingFile {
  path: string
  name: string
  mime: string
  size: number
  meta: FileMeta
  thumbPath?: string
}

export interface OutgoingVoice {
  path: string
  duration: number
  waveform: number[]
}

export interface OutgoingPayload {
  text: string
  files: OutgoingFile[]
  voice: OutgoingVoice | null
}

type Kind = 'photo' | 'video' | 'audio' | 'file'

function kindOf(file: OutgoingFile): Kind {
  if (file.meta.asFile) return 'file'
  if (PHOTO_MIMES.has(file.mime) && file.size <= PHOTO_LIMIT_BYTES) return 'photo'
  // Telegram faqat MP4'ni oqimli video sifatida ko'rsatadi
  if (file.mime === 'video/mp4' || file.mime === 'video/quicktime') return 'video'
  if (['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/flac', 'audio/wav'].includes(file.mime)) return 'audio'
  return 'file'
}

/** Rasm+video bir albomda, audio alohida, qolgan fayllar alohida; har albomda ko'pi bilan 10 ta */
function groupFiles(files: OutgoingFile[]): OutgoingFile[][] {
  const buckets: Record<'media' | 'audio' | 'file', OutgoingFile[]> = { media: [], audio: [], file: [] }
  for (const file of files) {
    const kind = kindOf(file)
    buckets[kind === 'photo' || kind === 'video' ? 'media' : kind].push(file)
  }
  const groups: OutgoingFile[][] = []
  for (const bucket of [buckets.media, buckets.audio, buckets.file]) {
    for (let i = 0; i < bucket.length; i += ALBUM_LIMIT) groups.push(bucket.slice(i, i + ALBUM_LIMIT))
  }
  return groups
}

function messagesFromUpdates(result: Api.TypeUpdates): Api.Message[] {
  const found: Api.Message[] = []
  if (result instanceof Api.Updates || result instanceof Api.UpdatesCombined) {
    for (const update of result.updates) {
      if ((update instanceof Api.UpdateNewMessage || update instanceof Api.UpdateNewChannelMessage) && update.message instanceof Api.Message) {
        found.push(update.message)
      }
    }
  }
  return found.sort((a, b) => a.id - b.id)
}

type ProgressFn = (fraction: number) => void

class UploadTracker {
  private done = 0
  constructor(
    private readonly total: number,
    private readonly report: ProgressFn,
  ) {}

  part(size: number): (fraction: number) => void {
    return (fraction) => this.report(this.total > 0 ? Math.min(1, (this.done + fraction * size) / this.total) : 1)
  }

  finish(size: number): void {
    this.done += size
    this.report(this.total > 0 ? Math.min(1, this.done / this.total) : 1)
  }
}

async function upload(client: TelegramClient, path: string, name: string, size: number, onProgress?: (fraction: number) => void): Promise<Api.TypeInputFile> {
  return client.uploadFile({
    file: new CustomFile(name, size, path),
    // Katta fayllar bir necha oqimda tezroq yuklanadi
    workers: size > 20 * 1024 * 1024 ? 8 : 2,
    onProgress,
  })
}

async function buildMedia(client: TelegramClient, file: OutgoingFile, kind: Kind, tracker: UploadTracker): Promise<Api.TypeInputMedia> {
  const uploaded = await upload(client, file.path, file.name, file.size, tracker.part(file.size))
  tracker.finish(file.size)
  const filename = new Api.DocumentAttributeFilename({ fileName: file.name })

  if (kind === 'photo') return new Api.InputMediaUploadedPhoto({ file: uploaded })

  let thumb: Api.TypeInputFile | undefined
  if (file.thumbPath) {
    const info = await stat(file.thumbPath).catch(() => null)
    if (info && info.size > 0 && info.size < 200 * 1024) thumb = await upload(client, file.thumbPath, 'thumb.jpg', info.size)
  }

  if (kind === 'video') {
    return new Api.InputMediaUploadedDocument({
      file: uploaded,
      mimeType: file.mime,
      thumb,
      attributes: [
        new Api.DocumentAttributeVideo({
          duration: file.meta.duration ?? 0,
          w: file.meta.width ?? 0,
          h: file.meta.height ?? 0,
          supportsStreaming: true,
        }),
        filename,
      ],
    })
  }

  if (kind === 'audio') {
    return new Api.InputMediaUploadedDocument({
      file: uploaded,
      mimeType: file.mime,
      attributes: [new Api.DocumentAttributeAudio({ duration: Math.round(file.meta.duration ?? 0), title: file.name.replace(/\.[^.]+$/, '') }), filename],
    })
  }

  return new Api.InputMediaUploadedDocument({ file: uploaded, mimeType: file.mime || 'application/octet-stream', forceFile: true, thumb, attributes: [filename] })
}

function isPhotoRejection(error: unknown): boolean {
  const code = telegramCode(error) ?? ''
  return code.startsWith('PHOTO_') || code === 'IMAGE_PROCESS_FAILED'
}

async function sendText(client: TelegramClient, chat: ChatRecord, text: string): Promise<Api.Message[]> {
  const sent: Api.Message[] = []
  for (let offset = 0; offset < text.length; offset += TEXT_LIMIT) {
    const message = await client.sendMessage(toInputPeer(chat), { message: text.slice(offset, offset + TEXT_LIMIT), parseMode: false, linkPreview: true })
    sent.push(message)
  }
  return sent
}

async function sendGroup(client: TelegramClient, chat: ChatRecord, group: OutgoingFile[], caption: string, tracker: UploadTracker): Promise<Api.Message[]> {
  const peer = toInputPeer(chat)
  const kinds = group.map(kindOf)

  if (group.length === 1) {
    const [file] = group
    try {
      const media = await buildMedia(client, file, kinds[0], tracker)
      const result = await client.invoke(new Api.messages.SendMedia({ peer, media, message: caption, randomId: generateRandomLong() }))
      return messagesFromUpdates(result)
    } catch (error) {
      if (kinds[0] !== 'photo' || !isPhotoRejection(error)) throw error
      // Telegram rasmni qabul qilmadi (o'lchami g'ayrioddiy) — fayl sifatida yuboramiz
      const media = await buildMedia(client, { ...file, meta: { ...file.meta, asFile: true } }, 'file', tracker)
      const result = await client.invoke(new Api.messages.SendMedia({ peer, media, message: caption, randomId: generateRandomLong() }))
      return messagesFromUpdates(result)
    }
  }

  const multiMedia: Api.InputSingleMedia[] = []
  for (const [index, file] of group.entries()) {
    const uploadedMedia = await buildMedia(client, file, kinds[index], tracker)
    const stored = await client.invoke(new Api.messages.UploadMedia({ peer, media: uploadedMedia }))
    const media =
      stored instanceof Api.MessageMediaPhoto && stored.photo
        ? getInputMedia(stored.photo)
        : stored instanceof Api.MessageMediaDocument && stored.document
          ? getInputMedia(stored.document)
          : null
    if (!media) throw new AppError(500, `«${file.name}» faylini tayyorlab bo'lmadi.`, 'UPLOAD_FAILED')
    multiMedia.push(new Api.InputSingleMedia({ media, message: index === 0 ? caption : '', randomId: generateRandomLong() }))
  }
  const result = await client.invoke(new Api.messages.SendMultiMedia({ peer, multiMedia }))
  return messagesFromUpdates(result)
}

/**
 * Matn, fayllar va ovozli xabarni Telegramga yuboradi.
 * Yuborilgan fayllar keshga ko'chiriladi, vaqtinchalik fayllar o'chiriladi.
 */
export async function sendPayload(client: TelegramClient, chat: ChatRecord, payload: OutgoingPayload, onProgress: ProgressFn): Promise<Api.Message[]> {
  const text = payload.text.trim()
  const sent: Api.Message[] = []
  const cleanup: string[] = [...payload.files.flatMap((f) => [f.path, f.thumbPath ?? '']), payload.voice?.path ?? ''].filter(Boolean)

  try {
    if (!payload.files.length && !payload.voice) {
      if (!text) throw new AppError(400, "Xabar bo'sh.", 'MESSAGE_EMPTY')
      const messages = await sendText(client, chat, text)
      onProgress(1)
      return messages
    }

    const total = payload.files.reduce((sum, f) => sum + f.size, 0) + (payload.voice ? 1 : 0)
    const tracker = new UploadTracker(total, onProgress)
    let caption = text
    if (caption.length > CAPTION_LIMIT) {
      sent.push(...(await sendText(client, chat, caption)))
      caption = ''
    }

    if (payload.voice) {
      const voice = payload.voice
      const converted = `${voice.path}.ogg`
      cleanup.push(converted)
      await convertToVoice(voice.path, converted)
      const size = (await stat(converted)).size
      const file = await upload(client, converted, 'voice.ogg', size)
      const media = new Api.InputMediaUploadedDocument({
        file,
        mimeType: 'audio/ogg',
        attributes: [
          new Api.DocumentAttributeAudio({
            voice: true,
            duration: Math.max(1, Math.round(voice.duration)),
            waveform: voice.waveform.length ? encodeWaveform(voice.waveform) : undefined,
          }),
        ],
      })
      const result = await client.invoke(new Api.messages.SendMedia({ peer: toInputPeer(chat), media, message: caption, randomId: generateRandomLong() }))
      const messages = messagesFromUpdates(result)
      caption = ''
      tracker.finish(1)
      if (messages[0]) await rememberSentFile(chat, messages[0].id, 'full', converted, 'audio/ogg', 'voice.ogg')
      sent.push(...messages)
    }

    for (const group of groupFiles(payload.files)) {
      const messages = await sendGroup(client, chat, group, caption, tracker)
      caption = ''
      // Albom tartibi yuborilgan fayllar tartibiga mos keladi
      for (const [index, message] of messages.entries()) {
        const file = group[index]
        if (!file) continue
        await rememberSentFile(chat, message.id, 'full', file.path, file.mime, file.name)
        if (file.thumbPath) await rememberSentFile(chat, message.id, 'thumb', file.thumbPath, 'image/jpeg', null)
      }
      sent.push(...messages)
    }
    onProgress(1)
    return sent
  } finally {
    await removeQuietly(...cleanup)
  }
}

/* ———————————— O'chirish va o'qildi belgisi ———————————— */

export async function deleteMessages(client: TelegramClient, chat: ChatRecord, ids: number[]): Promise<void> {
  await client.deleteMessages(toInputPeer(chat), ids, { revoke: true })
}

export async function markRead(client: TelegramClient, chat: ChatRecord): Promise<void> {
  const peer = toInputPeer(chat)
  if (peer instanceof Api.InputPeerChannel) {
    await client.invoke(new Api.channels.ReadHistory({ channel: new Api.InputChannel({ channelId: peer.channelId, accessHash: peer.accessHash }), maxId: 0 }))
  } else {
    await client.invoke(new Api.messages.ReadHistory({ peer, maxId: 0 }))
  }
}
