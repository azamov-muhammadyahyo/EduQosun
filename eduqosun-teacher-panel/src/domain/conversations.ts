import type { ChatAttachment, ChatMessage, Conversation } from '../types'
import { formatDuration } from '../lib/media'

export function lastMessage(conversation: Conversation): ChatMessage | undefined {
  return conversation.messages[conversation.messages.length - 1]
}

export function lastMessageAt(conversation: Conversation): string {
  return lastMessage(conversation)?.sentAt ?? ''
}

/** Qadalganlar tepada, qolganlari oxirgi xabar vaqti bo'yicha */
export function compareConversations(a: Conversation, b: Conversation): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
  return lastMessageAt(b).localeCompare(lastMessageAt(a))
}

/** Ro'yxat va bildirishnomalar uchun qisqa matn: "📷 3 ta rasm", "🎤 Ovozli xabar (0:12)" */
export function messagePreview(message: ChatMessage): string {
  if (message.text) return message.text
  const attachments = message.attachments ?? []
  if (attachments.length === 0) return ''
  const [first] = attachments
  const count = attachments.length
  const sameKind = attachments.every((a) => a.kind === first.kind)
  if (!sameKind) return `📎 ${count} ta fayl`
  switch (first.kind) {
    case 'photo':
      return count > 1 ? `📷 ${count} ta rasm` : '📷 Rasm'
    case 'video':
      return count > 1 ? `🎬 ${count} ta video` : '🎬 Video'
    case 'voice':
      return `🎤 Ovozli xabar (${formatDuration(first.duration)})`
    case 'audio':
      return count > 1 ? `🎵 ${count} ta audio` : `🎵 ${first.name ?? 'Audio'}`
    case 'file':
      return count > 1 ? `📎 ${count} ta fayl` : `📎 ${first.name ?? 'Fayl'}`
  }
}

/** Suhbatdagi eng katta Telegram xabar ID'si (keyingi sinxronlash shundan boshlanadi) */
export function maxTelegramId(conversation: Conversation): number {
  let max = 0
  for (const message of conversation.messages) {
    for (const id of message.tgIds ?? []) if (id > max) max = id
  }
  return max
}

function mergeAttachments(a: ChatAttachment[] = [], b: ChatAttachment[] = []): ChatAttachment[] {
  const byId = new Map<number | string, ChatAttachment>()
  for (const item of [...a, ...b]) byId.set(item.tgId ?? item.url, item)
  return [...byId.values()].sort((x, y) => (x.tgId ?? 0) - (y.tgId ?? 0))
}

function overlaps(a: number[] | undefined, b: number[] | undefined): boolean {
  if (!a?.length || !b?.length) return false
  return a.some((id) => b.includes(id))
}

/** Xabarni vaqt tartibida joylaydi */
function insertSorted(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
  let index = messages.length
  while (index > 0 && messages[index - 1].sentAt > message.sentAt) index -= 1
  return [...messages.slice(0, index), message, ...messages.slice(index)]
}

/**
 * Telegramdan kelgan xabarni ro'yxatga qo'shadi:
 *  - shu ID li xabar bo'lsa — yangilaydi
 *  - albomning keyingi qismi bo'lsa — mavjud xabarga fayl sifatida qo'shadi
 * `added` — ro'yxatga yangi xabar qo'shildimi (o'qilmaganlar soni uchun)
 */
export function upsertMessage(messages: ChatMessage[], incoming: ChatMessage): { messages: ChatMessage[]; added: boolean } {
  const index = messages.findIndex(
    (m) => m.id === incoming.id || overlaps(m.tgIds, incoming.tgIds) || (incoming.albumId !== undefined && m.albumId === incoming.albumId),
  )
  if (index === -1) return { messages: insertSorted(messages, incoming), added: true }

  const current = messages[index]
  const merged: ChatMessage = {
    ...current,
    ...incoming,
    id: current.id,
    text: incoming.text || current.text,
    read: current.read || incoming.read,
    tgIds: [...new Set([...(current.tgIds ?? []), ...(incoming.tgIds ?? [])])].sort((a, b) => a - b),
    attachments: mergeAttachments(current.attachments, incoming.attachments),
    status: undefined,
    error: undefined,
  }
  const next = [...messages]
  next[index] = merged
  return { messages: next, added: false }
}

/** Telegramda o'chirilgan xabarlarni (yoki albomdagi fayllarni) olib tashlaydi */
export function removeTelegramIds(messages: ChatMessage[], ids: number[]): ChatMessage[] {
  const removed = new Set(ids)
  let changed = false
  const next: ChatMessage[] = []
  for (const message of messages) {
    if (!message.tgIds?.some((id) => removed.has(id))) {
      next.push(message)
      continue
    }
    changed = true
    const tgIds = message.tgIds.filter((id) => !removed.has(id))
    if (tgIds.length === 0) continue
    next.push({ ...message, tgIds, attachments: message.attachments?.filter((a) => a.tgId === undefined || !removed.has(a.tgId)) })
  }
  return changed ? next : messages
}
