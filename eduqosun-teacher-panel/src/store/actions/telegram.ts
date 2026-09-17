import type { ChatDTO, ConversationMeta, HistoryDTO, LinkResultDTO, MessageDTO, ServerEvents, StatusDTO, Visibility } from '../../api/types'
import { API_BASE, ApiError, errorMessage } from '../../api/http'
import { telegramApi, type UserLookupInput } from '../../api/telegram'
import type { AccentColor, AttachmentKind, ChatAttachment, ChatMessage, Conversation, ConversationKind, TelegramLink } from '../../types'
import { maxTelegramId, messagePreview, removeTelegramIds, upsertMessage } from '../../domain/conversations'
import { createId } from '../../lib/id'
import type { MediaInfo } from '../../lib/media'
import { readJson, writeStorage } from '../../lib/storage'
import { parseHash } from '../../router'
import { getAppState, updateApp } from '../appStore'
import { patchTelegram, setProgress, telegramStore } from '../telegramStore'
import { toast } from '../toastStore'
import { pushNotification } from './feed'
import { buildConversation, findConversation } from './messages'

/*
 * Panel ↔ Telegram (eduqosun-server orqali):
 *  - holat va SSE hodisalari (yangi xabar, o'qildi, o'chirildi, yuborish natijasi)
 *  - suhbatlarni Telegram chatlariga ulash va sinxronlash
 *  - matn, fayl va ovozli xabar yuborish
 *
 * Bir nechta oyna ochiq bo'lsa, saqlanadigan holatni faqat bittasi ("yetakchi") o'zgartiradi,
 * qolganlari localStorage orqali yangilanadi — bildirishnomalar ikki marta chiqmaydi.
 */

/* ———————————— DTO → panel modeli ———————————— */

function fromMessageDTO(dto: MessageDTO): ChatMessage {
  return {
    id: dto.id,
    from: dto.from,
    author: dto.author,
    text: dto.text,
    sentAt: dto.sentAt,
    editedAt: dto.editedAt,
    read: dto.read,
    tgIds: dto.tgIds,
    albumId: dto.albumId,
    attachments: dto.attachments.map((a) => ({
      kind: a.kind,
      url: a.url,
      thumbUrl: a.thumbUrl,
      tgId: a.tgId,
      name: a.name,
      mime: a.mime,
      size: a.size,
      duration: a.duration,
      width: a.width,
      height: a.height,
      waveform: a.waveform,
    })),
  }
}

function linkFromChat(chat: ChatDTO | LinkResultDTO['chat']): TelegramLink {
  return {
    chatType: chat.chatType,
    title: chat.title,
    username: chat.username,
    inviteLink: chat.inviteLink,
    visibility: chat.visibility,
    membersCount: chat.membersCount,
    linkedAt: chat.linkedAt,
  }
}

function metaOf(conversation: Conversation): ConversationMeta {
  return {
    title: conversation.title,
    subtitle: conversation.subtitle,
    groupId: conversation.groupId,
    studentId: conversation.studentId,
    color: conversation.color,
  }
}

const ACCENTS: AccentColor[] = ['blue', 'green', 'violet', 'amber', 'rose', 'sky', 'orange', 'slate', 'teal', 'pink', 'indigo']

/* ———————————— Holat yordamchilari ———————————— */

function findById(id: string): Conversation | undefined {
  return getAppState().conversations.find((c) => c.id === id)
}

function updateConversation(id: string, recipe: (conversation: Conversation) => Conversation): void {
  updateApp((state) => {
    let changed = false
    const conversations = state.conversations.map((c) => {
      if (c.id !== id) return c
      const next = recipe(c)
      if (next !== c) changed = true
      return next
    })
    return changed ? { ...state, conversations } : state
  })
}

function isConversationOpen(id: string): boolean {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return false
  const route = parseHash(window.location.hash)
  return route.page === 'messages' && route.param === id
}

let leader = false

/* ———————————— Server va akkaunt holati ———————————— */

function applyStatus(status: StatusDTO): void {
  const previous = telegramStore.getState().auth
  patchTelegram({
    server: 'online',
    configured: status.configured,
    auth: status.state,
    account: status.account,
    phone: status.phone,
    codeVia: status.codeVia,
    passwordHint: status.passwordHint,
    maxUploadBytes: status.maxUploadBytes,
  })
  if (status.state === 'connected' && previous !== 'connected') void syncTelegram()
}

export async function refreshTelegramStatus(): Promise<void> {
  try {
    applyStatus(await telegramApi.status())
  } catch (error) {
    if (error instanceof ApiError && error.offline) patchTelegram({ server: 'offline' })
  }
}

/** Kirish bosqichlari (natija holati avtomatik qo'llanadi) */
export const telegramAuth = {
  sendCode: async (phone: string) => applyStatus(await telegramApi.sendCode(phone)),
  signIn: async (code: string) => applyStatus(await telegramApi.signIn(code)),
  checkPassword: async (password: string) => applyStatus(await telegramApi.checkPassword(password)),
  cancel: async () => applyStatus(await telegramApi.cancelLogin()),
  logout: async () => applyStatus(await telegramApi.logout()),
}

/* ———————————— Tarix va sinxronlash ———————————— */

function applyHistory(conversationId: string, history: HistoryDTO): void {
  const open = isConversationOpen(conversationId)
  updateConversation(conversationId, (conversation) => {
    let messages = conversation.messages
    for (const dto of history.messages) messages = upsertMessage(messages, fromMessageDTO(dto)).messages
    messages = messages.map((m) =>
      m.from === 'me' && !m.read && m.tgIds?.length && Math.max(...m.tgIds) <= history.readOutboxMaxId ? { ...m, read: true } : m,
    )
    return { ...conversation, messages, unread: open ? 0 : history.unread }
  })
  if (open && history.unread > 0) markTelegramRead(conversationId)
}

/** Serverda bor, lekin panelda yo'q suhbatni tiklaydi (masalan, demo ma'lumotlar qayta yaratilganda) */
function restoreConversation(chat: ChatDTO): Conversation | null {
  const state = getAppState()
  const { meta } = chat
  if (meta.groupId && !state.groups.some((g) => g.id === meta.groupId)) return null
  if (meta.studentId && !state.students.some((s) => s.id === meta.studentId)) return null
  return {
    id: chat.conversationId,
    kind: chat.kind,
    groupId: meta.groupId,
    studentId: meta.studentId,
    title: meta.title || chat.title,
    subtitle: meta.subtitle ?? 'Telegram',
    color: ACCENTS.includes(meta.color as AccentColor) ? (meta.color as AccentColor) : 'sky',
    pinned: false,
    unread: 0,
    messages: [],
    telegram: linkFromChat(chat),
  }
}

/* Panelda o'chirilgan, lekin serverda uzilmay qolgan suhbatlar (server o'chiq bo'lgan paytda) */
const PENDING_UNLINK_KEY = 'eduqosun-telegram-unlink'

function pendingUnlinks(): string[] {
  const list = readJson<unknown>(PENDING_UNLINK_KEY)
  return Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : []
}

function setPendingUnlinks(ids: string[]): void {
  writeStorage(PENDING_UNLINK_KEY, JSON.stringify([...new Set(ids)]))
}

async function flushPendingUnlinks(): Promise<Set<string>> {
  const ids = pendingUnlinks()
  const left: string[] = []
  for (const id of ids) {
    try {
      await telegramApi.unlink(id)
    } catch {
      left.push(id)
    }
  }
  setPendingUnlinks(left)
  return new Set(ids)
}

/** Serverga yetib bormagan yoki natijasi yo'qolgan xabarlarni aniqlaydi */
async function resolveOutbox(): Promise<void> {
  const sending = getAppState().conversations.flatMap((c) =>
    c.messages.filter((m) => m.status === 'sending' && !outgoing.has(m.id)).map((m) => ({ conversationId: c.id, id: m.id })),
  )
  if (!sending.length) return
  const results = await telegramApi.outbox(sending.map((m) => m.id))
  for (const result of results) {
    const item = sending.find((m) => m.id === result.clientId)
    if (!item) continue
    if (result.status === 'sent' && result.messages) applySent(item.conversationId, result.clientId, result.messages)
    else if (result.status === 'failed') markFailed(item.conversationId, result.clientId, result.error ?? 'Xabar yuborilmadi')
    else if (result.status === 'unknown') markFailed(item.conversationId, result.clientId, "Sahifa yangilangani uchun xabar yuborilmay qoldi.")
  }
}

let syncTask: Promise<void> | null = null
let lastSyncAt = 0

async function runSync(): Promise<void> {
  const removed = await flushPendingUnlinks()
  const chats = (await telegramApi.chats()).filter((chat) => !removed.has(chat.conversationId))
  const linked = new Map(chats.map((chat) => [chat.conversationId, chat]))

  // Serverda uzilgan suhbatlardan Telegram belgisi olib tashlanadi
  updateApp((state) => {
    if (!state.conversations.some((c) => c.telegram && !linked.has(c.id))) return state
    return { ...state, conversations: state.conversations.map((c) => (c.telegram && !linked.has(c.id) ? { ...c, telegram: undefined } : c)) }
  })

  for (const chat of chats) {
    let conversation = findById(chat.conversationId)
    if (!conversation) {
      const restored = restoreConversation(chat)
      if (!restored) {
        await telegramApi.unlink(chat.conversationId).catch(() => undefined)
        continue
      }
      updateApp((state) => ({ ...state, conversations: [restored, ...state.conversations] }))
      conversation = restored
    } else {
      updateConversation(chat.conversationId, (c) => ({ ...c, telegram: linkFromChat(chat) }))
    }
    const minId = maxTelegramId(conversation)
    try {
      applyHistory(chat.conversationId, await telegramApi.history(chat.conversationId, minId, minId > 0 ? 100 : 40))
    } catch (error) {
      console.warn(`«${chat.title}» tarixini olib bo'lmadi:`, errorMessage(error))
    }
  }

  await resolveOutbox()
}

/** Ulangan chatlarning yangi xabarlarini oladi (bir vaqtda bitta) */
export function syncTelegram(): Promise<void> {
  if (!leader || telegramStore.getState().auth !== 'connected') return Promise.resolve()
  if (syncTask) return syncTask
  lastSyncAt = Date.now()
  syncTask = runSync()
    .catch((error) => {
      if (error instanceof ApiError && error.offline) patchTelegram({ server: 'offline' })
      else console.warn('Telegram sinxronlashda xato:', errorMessage(error))
    })
    .finally(() => {
      syncTask = null
    })
  return syncTask
}

/* ———————————— O'qildi belgisi ———————————— */

const readTimers = new Map<string, number>()

/** Telegramda ham o'qilgan deb belgilash (tez-tez chaqirilsa bittaga jamlanadi) */
export function markTelegramRead(conversationId: string): void {
  if (!findById(conversationId)?.telegram) return
  window.clearTimeout(readTimers.get(conversationId))
  readTimers.set(
    conversationId,
    window.setTimeout(() => {
      readTimers.delete(conversationId)
      void telegramApi.markRead(conversationId).catch(() => undefined)
    }, 800),
  )
}

/* ———————————— SSE hodisalari ———————————— */

function notifyIncoming(conversation: Conversation, message: ChatMessage): void {
  const { settings } = getAppState()
  if (!settings.notifyMessages) return
  const preview = messagePreview(message)
  const text = message.author && conversation.kind === 'group' ? `${message.author}: ${preview}` : preview
  pushNotification({ kind: 'message', title: conversation.title, text, route: `messages/${conversation.id}` }, { sound: settings.sound })
  if (parseHash(window.location.hash).page !== 'messages') {
    toast({
      tone: 'info',
      title: conversation.title,
      description: text.length > 90 ? `${text.slice(0, 90)}…` : text,
      actionLabel: 'Ochish',
      onAction: () => {
        window.location.hash = `#messages/${conversation.id}`
      },
    })
  }
}

function onIncoming(conversationId: string, dto: MessageDTO): void {
  const conversation = findById(conversationId)
  if (!conversation) return
  const message = fromMessageDTO(dto)
  const open = isConversationOpen(conversationId)
  const { messages, added } = upsertMessage(conversation.messages, message)
  const countUnread = added && message.from === 'them' && !open
  updateConversation(conversationId, (c) => ({ ...c, messages, unread: countUnread ? c.unread + 1 : c.unread }))
  if (message.from === 'them' && added) {
    if (open) markTelegramRead(conversationId)
    else notifyIncoming(conversation, message)
  }
}

function applySent(conversationId: string, clientId: string, dtos: MessageDTO[]): void {
  updateConversation(conversationId, (conversation) => {
    const index = conversation.messages.findIndex((m) => m.id === clientId)
    if (index === -1 && dtos.every((dto) => conversation.messages.some((m) => m.id === dto.id))) return conversation
    const sent = dtos.map(fromMessageDTO)
    rememberLocalPreviews(conversation.messages[index], sent)
    let messages = conversation.messages.filter((m) => m.id !== clientId)
    for (const message of sent) messages = upsertMessage(messages, message).messages
    return { ...conversation, messages }
  })
}

function markFailed(conversationId: string, clientId: string, error: string): void {
  updateConversation(conversationId, (conversation) => {
    if (!conversation.messages.some((m) => m.id === clientId && m.status === 'sending')) return conversation
    return { ...conversation, messages: conversation.messages.map((m) => (m.id === clientId ? { ...m, status: 'failed' as const, error } : m)) }
  })
}

type Handlers = { [K in keyof ServerEvents]: (data: ServerEvents[K]) => void }

const handlers: Handlers = {
  status: applyStatus,
  'message:new': ({ conversationId, message }) => {
    if (leader) onIncoming(conversationId, message)
  },
  'message:edit': ({ conversationId, message }) => {
    if (!leader) return
    updateConversation(conversationId, (c) => {
      if (!c.messages.some((m) => m.tgIds?.some((id) => message.tgIds.includes(id)))) return c
      return { ...c, messages: upsertMessage(c.messages, fromMessageDTO(message)).messages }
    })
  },
  'message:sent': ({ conversationId, clientId, messages }) => {
    const local = outgoing.get(clientId)
    outgoing.delete(clientId)
    setProgress(clientId, null)
    if (leader || local) applySent(conversationId, clientId, messages)
  },
  'message:progress': ({ clientId, progress }) => {
    // Yuklashning birinchi yarmi — brauzer → server, ikkinchisi — server → Telegram
    setProgress(clientId, 0.5 + progress * 0.5)
  },
  'message:failed': ({ conversationId, clientId, error }) => {
    setProgress(clientId, null)
    if (leader || outgoing.has(clientId)) markFailed(conversationId, clientId, error)
  },
  'message:delete': ({ conversationIds, ids }) => {
    if (!leader) return
    for (const conversationId of conversationIds) {
      updateConversation(conversationId, (c) => {
        const messages = removeTelegramIds(c.messages, ids)
        return messages === c.messages ? c : { ...c, messages }
      })
    }
  },
  'message:read': ({ conversationId, maxId }) => {
    if (!leader) return
    updateConversation(conversationId, (c) => {
      if (!c.messages.some((m) => m.from === 'me' && !m.read && m.tgIds?.length && Math.max(...m.tgIds) <= maxId)) return c
      return {
        ...c,
        messages: c.messages.map((m) => (m.from === 'me' && !m.read && m.tgIds?.length && Math.max(...m.tgIds) <= maxId ? { ...m, read: true } : m)),
      }
    })
  },
  'chat:read': ({ conversationId, unread }) => {
    if (!leader) return
    // Telefonda o'qilgan bo'lsa panelda ham o'qilgan bo'ladi
    updateConversation(conversationId, (c) => (c.unread === unread ? c : { ...c, unread }))
  },
  'chat:removed': ({ conversationId }) => {
    if (!leader) return
    updateConversation(conversationId, (c) => (c.telegram ? { ...c, telegram: undefined } : c))
  },
}

const SYNC_INTERVAL_MS = 3 * 60_000
const FOCUS_SYNC_GAP_MS = 20_000

/** Telegram bilan jonli aloqani boshlaydi (ilova ochilganda bir marta). Qaytgan funksiya — to'xtatish */
export function startTelegram(): () => void {
  let stopped = false
  let source: EventSource | null = null
  let retryTimer: number | undefined
  let retryDelay = 2000
  const lockAbort = new AbortController()
  let releaseLock: (() => void) | undefined

  const becomeLeader = () => {
    leader = true
    void syncTelegram()
  }

  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  if (locks?.request) {
    locks
      .request('eduqosun-telegram-leader', { signal: lockAbort.signal }, () => {
        if (stopped) return undefined
        becomeLeader()
        return new Promise<void>((resolve) => {
          releaseLock = resolve
        })
      })
      .catch(() => undefined)
  } else {
    becomeLeader()
  }

  const connect = () => {
    if (stopped) return
    source = new EventSource(`${API_BASE}/events`)
    source.onopen = () => {
      retryDelay = 2000
      // Uzilish paytida o'zgargan holat va xabarlarni olamiz
      void refreshTelegramStatus().then(() => syncTelegram())
    }
    source.onerror = () => {
      if (!source || source.readyState !== EventSource.CLOSED) return
      source = null
      patchTelegram({ server: 'offline' })
      retryTimer = window.setTimeout(connect, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 30_000)
    }
    for (const type of Object.keys(handlers) as (keyof ServerEvents)[]) {
      source.addEventListener(type, (event) => {
        try {
          ;(handlers[type] as (data: unknown) => void)(JSON.parse((event as MessageEvent<string>).data))
        } catch (error) {
          console.warn(`Hodisani qayta ishlashda xato (${type}):`, error)
        }
      })
    }
  }

  void refreshTelegramStatus()
  connect()

  const onFocus = () => {
    if (Date.now() - lastSyncAt > FOCUS_SYNC_GAP_MS) void syncTelegram()
  }
  window.addEventListener('focus', onFocus)
  const interval = window.setInterval(() => void syncTelegram(), SYNC_INTERVAL_MS)

  return () => {
    stopped = true
    leader = false
    source?.close()
    window.clearTimeout(retryTimer)
    window.clearInterval(interval)
    window.removeEventListener('focus', onFocus)
    lockAbort.abort()
    releaseLock?.()
  }
}

/* ———————————— Suhbatni ulash ———————————— */

function applyLinkResult(base: Conversation, result: LinkResultDTO): void {
  const telegram = linkFromChat(result.chat)
  updateApp((state) => {
    const exists = state.conversations.some((c) => c.id === base.id)
    const conversations = exists
      ? state.conversations.map((c) => (c.id === base.id ? { ...c, telegram } : c))
      : [{ ...base, telegram }, ...state.conversations]
    return { ...state, conversations }
  })
  applyHistory(base.id, result.history)
}

export type GroupSource = { type: 'existing'; groupId: string } | { type: 'custom'; title: string } | { type: 'conversation'; conversationId: string }

function groupConversation(source: GroupSource): Conversation {
  if (source.type === 'conversation') {
    const conversation = findById(source.conversationId)
    if (!conversation) throw new Error('Suhbat topilmadi')
    return conversation
  }
  if (source.type === 'existing') {
    const conversation = findConversation({ kind: 'group', id: source.groupId }) ?? buildConversation({ kind: 'group', id: source.groupId })
    if (!conversation) throw new Error('Guruh topilmadi')
    return conversation
  }
  return {
    id: createId('cnv'),
    kind: 'group',
    title: source.title.trim(),
    subtitle: 'Telegram guruhi',
    color: 'sky',
    pinned: false,
    unread: 0,
    messages: [],
  }
}

export type GroupTelegramMode =
  | { type: 'link'; link: string }
  | { type: 'create'; visibility: Visibility; username: string; about: string }

export interface LinkOutcome {
  conversationId: string
  warning?: string
}

export async function linkGroupChat(source: GroupSource, mode: GroupTelegramMode): Promise<LinkOutcome> {
  const conversation = groupConversation(source)
  const result =
    mode.type === 'link'
      ? await telegramApi.linkGroup({ conversationId: conversation.id, meta: metaOf(conversation), link: mode.link })
      : await telegramApi.createGroup({
          conversationId: conversation.id,
          meta: metaOf(conversation),
          title: conversation.kind === 'group' && conversation.groupId ? conversation.title.replace(/^Guruh /, '') : conversation.title,
          about: mode.about,
          visibility: mode.visibility,
          username: mode.username,
        })
  applyLinkResult(conversation, result)
  return { conversationId: conversation.id, warning: result.warning }
}

export type PersonSource = { type: 'student'; kind: Exclude<ConversationKind, 'group'>; studentId: string } | { type: 'conversation'; conversationId: string }

export async function linkPersonChat(source: PersonSource, lookup: UserLookupInput): Promise<LinkOutcome> {
  const conversation =
    source.type === 'conversation'
      ? findById(source.conversationId)
      : (findConversation({ kind: source.kind, id: source.studentId }) ?? buildConversation({ kind: source.kind, id: source.studentId }))
  if (!conversation || conversation.kind === 'group') throw new Error('Suhbat topilmadi')
  const result = await telegramApi.linkUser({ ...lookup, conversationId: conversation.id, kind: conversation.kind, meta: metaOf(conversation) })
  applyLinkResult(conversation, result)
  return { conversationId: conversation.id }
}

/** Telegram bilan aloqani uzish (xabarlar tarixi panelda qoladi) */
export async function unlinkConversation(conversationId: string): Promise<void> {
  await telegramApi.unlink(conversationId)
  updateConversation(conversationId, (c) => ({ ...c, telegram: undefined }))
}

/** Suhbat o'chirilganda serverdagi bog'lanish ham olib tashlanadi (server o'chiq bo'lsa — keyinroq) */
export function forgetConversationLink(conversationId: string): void {
  telegramApi.unlink(conversationId).catch(() => setPendingUnlinks([...pendingUnlinks(), conversationId]))
}

/* ———————————— Yuborish ———————————— */

export interface PendingFile {
  id: string
  file: File
  /** blob: manzil (oldindan ko'rish uchun) */
  url: string
  kind: AttachmentKind
  info: MediaInfo
  /** Video kichik nusxasining blob: manzili */
  thumbUrl?: string
}

export interface RecordedVoice {
  blob: Blob
  duration: number
  waveform: number[]
}

export interface OutgoingInput {
  text: string
  files: PendingFile[]
  voice: RecordedVoice | null
  /** Rasmlarni siqmasdan, fayl sifatida yuborish */
  asDocuments: boolean
}

interface OutgoingEntry {
  conversationId: string
  input: OutgoingInput
  voiceUrl?: string
  abort?: () => void
}

/** Shu oynada yuborilayotgan xabarlar (fayllar xotirada — qayta yuborish uchun) */
const outgoing = new Map<string, OutgoingEntry>()

/** Yuborilgan fayllarning mahalliy nusxasi — server nusxasi yuklanguncha shu ko'rsatiladi */
const localPreviews = new Map<string, string>()

/**
 * Server fayllarni turi bo'yicha guruhlab yuboradi (rasm/video, audio, fayl),
 * shuning uchun mahalliy nusxalar tartib bo'yicha emas, tur bo'yicha moslanadi.
 */
function rememberLocalPreviews(optimistic: ChatMessage | undefined, sent: ChatMessage[]): void {
  const queues = new Map<AttachmentKind, ChatAttachment[]>()
  for (const attachment of optimistic?.attachments ?? []) {
    if (!attachment.url.startsWith('blob:')) continue
    queues.set(attachment.kind, [...(queues.get(attachment.kind) ?? []), attachment])
  }
  for (const attachment of sent.flatMap((m) => m.attachments ?? [])) {
    const source = queues.get(attachment.kind)?.shift()
    if (!source) continue
    localPreviews.set(attachment.url, source.url)
    const thumb = source.thumbUrl ?? (source.kind === 'photo' ? source.url : undefined)
    if (attachment.thumbUrl && thumb) localPreviews.set(attachment.thumbUrl, thumb)
  }
}

/** Ko'rsatish uchun manzil: shu seansda yuborilgan fayl bo'lsa — uning mahalliy nusxasi */
export function displayUrl(url: string | undefined): string | undefined {
  return url ? (localPreviews.get(url) ?? url) : undefined
}

export function canRetry(messageId: string): boolean {
  return outgoing.has(messageId)
}

function extensionOfVoice(type: string): string {
  if (type.includes('ogg')) return 'ogg'
  if (type.includes('mp4')) return 'm4a'
  return 'webm'
}

function upload(clientId: string): void {
  const entry = outgoing.get(clientId)
  if (!entry) return
  const { input, conversationId } = entry
  const form = new FormData()
  form.append('clientId', clientId)
  form.append('text', input.text)
  form.append(
    'meta',
    JSON.stringify(
      input.files.map((f) => ({
        name: f.file.name,
        width: f.info.width,
        height: f.info.height,
        duration: f.info.duration,
        asFile: input.asDocuments && f.kind === 'photo',
      })),
    ),
  )
  input.files.forEach((f, index) => {
    form.append('files', f.file, f.file.name)
    if (f.info.thumb && !input.asDocuments) form.append(`thumb:${index}`, f.info.thumb, 'thumb.jpg')
  })
  if (input.voice) {
    form.append('voice', input.voice.blob, `voice.${extensionOfVoice(input.voice.blob.type)}`)
    form.append('voiceMeta', JSON.stringify({ duration: input.voice.duration, waveform: input.voice.waveform }))
  }

  const hasFiles = input.files.length > 0 || input.voice !== null
  setProgress(clientId, 0)
  const request = telegramApi.send(conversationId, form, hasFiles ? (fraction) => setProgress(clientId, fraction * 0.5) : undefined)
  entry.abort = request.abort
  request.promise
    .then(() => {
      entry.abort = undefined
      const current = telegramStore.getState().progress[clientId]
      if (current !== undefined && current < 0.5 && hasFiles) setProgress(clientId, 0.5)
    })
    .catch((error: unknown) => {
      entry.abort = undefined
      setProgress(clientId, null)
      if (error instanceof ApiError && error.code === 'ABORTED') return
      markFailed(conversationId, clientId, errorMessage(error))
    })
}

function optimisticAttachments(input: OutgoingInput, voiceUrl: string | undefined): ChatAttachment[] {
  const list: ChatAttachment[] = []
  if (input.voice && voiceUrl) {
    list.push({ kind: 'voice', url: voiceUrl, duration: input.voice.duration, waveform: input.voice.waveform, mime: input.voice.blob.type, size: input.voice.blob.size })
  }
  for (const f of input.files) {
    list.push({
      kind: input.asDocuments && f.kind === 'photo' ? 'file' : f.kind,
      url: f.url,
      thumbUrl: f.thumbUrl,
      name: f.file.name,
      mime: f.file.type,
      size: f.file.size,
      width: f.info.width,
      height: f.info.height,
      duration: f.info.duration,
    })
  }
  return list
}

/**
 * Suhbatga xabar yuboradi. Telegramga ulangan bo'lsa — server orqali, aks holda faqat panelda saqlanadi.
 * Qaytadi: yangi xabar ID'si (yoki null — yuboriladigan narsa yo'q).
 */
export function sendConversationMessage(conversationId: string, input: OutgoingInput): string | null {
  const conversation = findById(conversationId)
  const text = input.text.trim()
  if (!conversation || (!text && input.files.length === 0 && !input.voice)) return null

  const clientId = createId('out')
  const voiceUrl = input.voice ? URL.createObjectURL(input.voice.blob) : undefined
  const local = !conversation.telegram
  const message: ChatMessage = {
    id: clientId,
    from: 'me',
    text,
    sentAt: new Date().toISOString(),
    read: false,
    attachments: local ? undefined : optimisticAttachments({ ...input, text }, voiceUrl),
    status: local ? undefined : 'sending',
  }
  updateConversation(conversationId, (c) => ({ ...c, unread: 0, messages: [...c.messages, message] }))
  if (local) return clientId

  outgoing.set(clientId, { conversationId, input: { ...input, text }, voiceUrl })
  upload(clientId)
  return clientId
}

export function retryMessage(conversationId: string, messageId: string): void {
  if (!outgoing.has(messageId)) return
  updateConversation(conversationId, (c) => ({
    ...c,
    messages: c.messages.map((m) => (m.id === messageId ? { ...m, status: 'sending' as const, error: undefined, sentAt: new Date().toISOString() } : m)),
  }))
  upload(messageId)
}

/** Yuborilmagan (yoki hali serverga yetmagan) xabarni bekor qilish */
export function discardMessage(conversationId: string, messageId: string): void {
  const entry = outgoing.get(messageId)
  entry?.abort?.()
  outgoing.delete(messageId)
  setProgress(messageId, null)
  updateConversation(conversationId, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== messageId) }))
}

/** Hali brauzerdan serverga yuklanyaptimi (bekor qilish mumkin) */
export function isUploading(messageId: string): boolean {
  return Boolean(outgoing.get(messageId)?.abort)
}

/** Telegramdagi xabarni hamma uchun o'chiradi */
export async function deleteTelegramMessage(conversationId: string, message: ChatMessage): Promise<void> {
  if (message.tgIds?.length) await telegramApi.deleteMessages(conversationId, message.tgIds)
  updateConversation(conversationId, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== message.id) }))
}
