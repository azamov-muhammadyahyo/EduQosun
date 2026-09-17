import { deleteChat, getChat, saveChat, toChatDTO, type ChatRecord } from '../db.js'
import { AppError, toAppError } from '../errors.js'
import { broadcast } from '../events.js'
import type { ConversationKind, ConversationMeta, LinkResultDTO, OutboxResultDTO } from '../types.js'
import { telegram } from './client.js'
import { fetchHistory, mergeAlbums, sendPayload, toMessageDTO, type OutgoingPayload } from './messages.js'
import { removeQuietly } from './media.js'
import { createGroup, joinGroupByLink, refreshChatInfo, resolveUser, type CreateGroupInput, type ResolvedChat, type UserLookup } from './peers.js'
import { enqueue } from './queue.js'

/* Panel suhbatlarini Telegram chatlariga bog'lash va ular orqali xabar almashish */

const HISTORY_ON_LINK = 40

export function requireChat(conversationId: string): ChatRecord {
  const chat = getChat(conversationId)
  if (!chat) throw new AppError(404, 'Bu suhbat Telegramga ulanmagan.', 'CHAT_NOT_LINKED')
  return chat
}

async function persistLink(conversationId: string, kind: ConversationKind, meta: ConversationMeta, resolved: ResolvedChat, warning?: string): Promise<LinkResultDTO> {
  const { peer, preview } = resolved
  const chat: ChatRecord = {
    conversationId,
    kind,
    peerType: peer.type,
    peerId: peer.id,
    accessHash: peer.accessHash,
    chatType: preview.chatType,
    title: preview.title,
    username: preview.username,
    inviteLink: preview.inviteLink,
    visibility: preview.visibility,
    membersCount: preview.membersCount,
    meta,
    linkedAt: new Date().toISOString(),
  }
  saveChat(chat)
  // Tarixni olib bo'lmasa ham bog'lanish saqlanib qoladi — panel keyinroq sinxronlaydi
  const history = await telegram
    .run((client) => fetchHistory(client, chat, { limit: HISTORY_ON_LINK }))
    .catch(() => ({ messages: [], unread: 0, readOutboxMaxId: 0 }))
  return { chat: toChatDTO(chat), history, warning }
}

export function linkGroup(conversationId: string, meta: ConversationMeta, link: string): Promise<LinkResultDTO> {
  return telegram.run(async (client) => persistLink(conversationId, 'group', meta, await joinGroupByLink(client, link)))
}

export function createAndLinkGroup(conversationId: string, meta: ConversationMeta, input: CreateGroupInput): Promise<LinkResultDTO> {
  return telegram.run(async (client) => {
    const created = await createGroup(client, input)
    return persistLink(conversationId, 'group', meta, created, created.warning)
  })
}

export function linkUser(conversationId: string, kind: ConversationKind, meta: ConversationMeta, lookup: UserLookup, addContact: boolean): Promise<LinkResultDTO> {
  return telegram.run(async (client) => persistLink(conversationId, kind, meta, await resolveUser(client, lookup, addContact)))
}

export function unlink(conversationId: string): void {
  deleteChat(conversationId)
  broadcast('chat:removed', { conversationId })
}

/** Nom va a'zolar sonini Telegramdan yangilaydi */
export async function refreshChat(conversationId: string): Promise<ChatRecord> {
  const chat = requireChat(conversationId)
  const patch = await telegram.run((client) => refreshChatInfo(client, chat))
  const next = { ...chat, ...patch }
  saveChat(next)
  return next
}

/** Suhbat metama'lumotini yangilash (panelda nomi o'zgarsa) */
export function updateMeta(conversationId: string, meta: ConversationMeta): ChatRecord {
  const chat = requireChat(conversationId)
  const next = { ...chat, meta }
  saveChat(next)
  return next
}

/* ———————————— Yuborish natijalari ———————————— */

/**
 * So'nggi yuborishlar natijasi (panel SSE uzilib qolgan paytda natijani o'tkazib yuborsa,
 * keyin shu yerdan so'rab oladi).
 */
const OUTBOX_TTL_MS = 60 * 60 * 1000
const outbox = new Map<string, { at: number; result: OutboxResultDTO }>()

function remember(result: OutboxResultDTO): void {
  const now = Date.now()
  outbox.set(result.clientId, { at: now, result })
  for (const [key, entry] of outbox) if (now - entry.at > OUTBOX_TTL_MS) outbox.delete(key)
}

export function outboxStatus(clientIds: string[]): OutboxResultDTO[] {
  return clientIds.map((clientId) => outbox.get(clientId)?.result ?? { clientId, status: 'unknown' })
}

/**
 * Xabarni navbatga qo'yadi va darhol qaytadi.
 * Natija panelga SSE orqali keladi: message:progress → message:sent | message:failed
 */
export function queueSend(conversationId: string, clientId: string, payload: OutgoingPayload): void {
  const chat = requireChat(conversationId)
  let lastReported = -1
  remember({ clientId, status: 'pending' })

  const report = (fraction: number) => {
    const progress = Math.round(fraction * 100) / 100
    if (progress - lastReported < 0.02 && progress < 1) return
    lastReported = progress
    broadcast('message:progress', { conversationId, clientId, progress })
  }

  enqueue(`${chat.peerType}:${chat.peerId}`, () => telegram.run((client) => sendPayload(client, chat, payload, report)))
    .then((sent) => {
      const messages = mergeAlbums(sent.map((message) => toMessageDTO(message, conversationId)))
      remember({ clientId, status: 'sent', messages })
      broadcast('message:sent', { conversationId, clientId, messages })
    })
    .catch(async (error: unknown) => {
      await removeQuietly(...payload.files.flatMap((f) => [f.path, f.thumbPath]), payload.voice?.path)
      const message = toAppError(error).message
      remember({ clientId, status: 'failed', error: message })
      broadcast('message:failed', { conversationId, clientId, error: message })
    })
}
