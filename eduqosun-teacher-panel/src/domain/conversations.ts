import type { ChatMessage, Conversation } from '../types'

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
