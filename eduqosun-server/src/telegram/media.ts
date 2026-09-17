import { execFile } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { rename, rm } from 'node:fs/promises'
import path from 'node:path'
import ffmpegPath from 'ffmpeg-static'
import { Api, type TelegramClient } from 'telegram'
import { config } from '../config.js'
import { forgetMedia, getMedia, saveMedia, type ChatRecord, type MediaRecord } from '../db.js'
import { AppError } from '../errors.js'
import { chatPeerKey, toInputPeer } from './peers.js'

/* ———————————— Ovozli xabar ———————————— */

/** Brauzer yozgan ovozni (webm/mp4) Telegram ovozli xabari formatiga — OGG/Opus — o'giradi */
export function convertToVoice(input: string, output: string): Promise<void> {
  const binary = ffmpegPath as unknown as string | null
  if (!binary) return Promise.reject(new AppError(500, 'ffmpeg topilmadi. `npm install` ni qayta ishga tushiring.', 'FFMPEG_MISSING'))
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '48k', '-application', 'voip', '-f', 'ogg', output]
  return new Promise((resolve, reject) => {
    execFile(binary, args, { timeout: 120_000 }, (error, _stdout, stderr) => {
      if (error) reject(new AppError(400, `Ovozli xabarni o'girib bo'lmadi: ${stderr.trim() || error.message}`, 'VOICE_CONVERT_FAILED'))
      else resolve()
    })
  })
}

/** Telegram to'lqin formati: har bir qiymat 5 bit (0–31), kichik tartibda (little-endian) */
export function encodeWaveform(values: number[]): Buffer {
  const bytes = Buffer.alloc(Math.ceil((values.length * 5) / 8) + 1)
  values.forEach((raw, index) => {
    const value = Math.max(0, Math.min(31, Math.round(raw))) & 31
    const bitOffset = index * 5
    const byteIndex = bitOffset >> 3
    const word = value << (bitOffset & 7)
    bytes[byteIndex] |= word & 0xff
    bytes[byteIndex + 1] |= (word >> 8) & 0xff
  })
  return bytes.subarray(0, Math.ceil((values.length * 5) / 8))
}

export function decodeWaveform(buffer: Buffer | undefined): number[] | undefined {
  if (!buffer || buffer.length === 0) return undefined
  const count = Math.floor((buffer.length * 8) / 5)
  const values: number[] = []
  for (let index = 0; index < count; index += 1) {
    const bitOffset = index * 5
    const byteIndex = bitOffset >> 3
    const word = buffer[byteIndex] | ((buffer[byteIndex + 1] ?? 0) << 8)
    values.push((word >> (bitOffset & 7)) & 31)
  }
  return values
}

/* ———————————— Media keshi ———————————— */

export type MediaVariant = 'full' | 'thumb'

function mediaFolder(chat: ChatRecord): string {
  const folder = path.join(config.mediaDir, chatPeerKey(chat).replace(':', '_'))
  mkdirSync(folder, { recursive: true })
  return folder
}

function extensionOf(mime: string, name: string | null): string {
  const fromName = name ? path.extname(name) : ''
  if (fromName && fromName.length <= 6) return fromName.toLowerCase()
  const known: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'application/pdf': '.pdf',
  }
  return known[mime] ?? '.bin'
}

/** Yuborilgan faylni keshga ko'chiradi — keyin Telegramdan qayta yuklab olinmaydi */
export async function rememberSentFile(chat: ChatRecord, msgId: number, variant: MediaVariant, source: string, mime: string, name: string | null): Promise<void> {
  const target = path.join(mediaFolder(chat), `${msgId}-${variant}${extensionOf(mime, name)}`)
  try {
    await rename(source, target)
  } catch {
    return
  }
  saveMedia(chatPeerKey(chat), msgId, variant, { file: target, mime, name })
}

function documentName(document: Api.Document): string | null {
  const attr = document.attributes.find((a): a is Api.DocumentAttributeFilename => a instanceof Api.DocumentAttributeFilename)
  return attr?.fileName ?? null
}

/** Rasm uchun ekranga mos o'lcham (~800–1280 px) */
function previewPhotoSize(photo: Api.Photo): Api.TypePhotoSize | undefined {
  const sizes = photo.sizes.filter((s): s is Api.PhotoSize | Api.PhotoSizeProgressive => s instanceof Api.PhotoSize || s instanceof Api.PhotoSizeProgressive)
  return sizes.find((s) => s.type === 'x') ?? sizes.find((s) => s.type === 'y') ?? sizes.at(-1)
}

function bestThumb(thumbs: Api.TypePhotoSize[] | undefined): Api.TypePhotoSize | undefined {
  const sizes = (thumbs ?? []).filter((s): s is Api.PhotoSize | Api.PhotoSizeProgressive => s instanceof Api.PhotoSize || s instanceof Api.PhotoSizeProgressive)
  return sizes.at(-1)
}

const inflight = new Map<string, Promise<MediaRecord>>()

async function download(client: TelegramClient, chat: ChatRecord, msgId: number, variant: MediaVariant): Promise<MediaRecord> {
  const [message] = await client.getMessages(toInputPeer(chat), { ids: [msgId] })
  if (!(message instanceof Api.Message) || !message.media) throw new AppError(404, 'Fayl topilmadi yoki o‘chirilgan.', 'MEDIA_NOT_FOUND')
  const media = message.media

  let mime = 'application/octet-stream'
  let name: string | null = null
  let thumb: Api.TypePhotoSize | undefined

  if (media instanceof Api.MessageMediaPhoto && media.photo instanceof Api.Photo) {
    mime = 'image/jpeg'
    if (variant === 'thumb') thumb = previewPhotoSize(media.photo)
  } else if (media instanceof Api.MessageMediaDocument && media.document instanceof Api.Document) {
    if (variant === 'thumb') {
      thumb = bestThumb(media.document.thumbs)
      if (!thumb) throw new AppError(404, "Kichik rasm yo'q.", 'THUMB_NOT_FOUND')
      mime = 'image/jpeg'
    } else {
      mime = media.document.mimeType || mime
      name = documentName(media.document)
    }
  } else {
    throw new AppError(404, "Bu xabarda yuklab olinadigan fayl yo'q.", 'MEDIA_NOT_FOUND')
  }

  const target = path.join(mediaFolder(chat), `${msgId}-${variant}${extensionOf(mime, name)}`)
  const partial = `${target}.part`
  await client.downloadMedia(message, { outputFile: partial, thumb })
  await rename(partial, target)
  const record = { file: target, mime, name }
  saveMedia(chatPeerKey(chat), msgId, variant, record)
  return record
}

/** Faylni keshdan beradi, bo'lmasa Telegramdan yuklab oladi */
export async function getMediaFile(client: TelegramClient, chat: ChatRecord, msgId: number, variant: MediaVariant): Promise<MediaRecord> {
  const key = chatPeerKey(chat)
  const cached = getMedia(key, msgId, variant)
  if (cached && existsSync(cached.file)) return cached
  if (cached) forgetMedia(key, msgId, variant)

  // O'zimiz yuborgan rasmning kichik nusxasi o'rniga aslining o'zi yetadi
  if (variant === 'thumb') {
    const full = getMedia(key, msgId, 'full')
    if (full && full.mime.startsWith('image/') && existsSync(full.file)) return full
  }

  const flightKey = `${key}/${msgId}/${variant}`
  let task = inflight.get(flightKey)
  if (!task) {
    task = download(client, chat, msgId, variant).finally(() => inflight.delete(flightKey))
    inflight.set(flightKey, task)
  }
  return task
}

export async function removeQuietly(...files: (string | undefined)[]): Promise<void> {
  await Promise.all(files.filter((f): f is string => Boolean(f)).map((file) => rm(file, { force: true }).catch(() => undefined)))
}
