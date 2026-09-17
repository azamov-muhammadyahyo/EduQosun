import type { ChatMessage, ComposeTarget, Conversation } from '../../types'
import { createId } from '../../lib/id'
import { fullName } from '../../domain/students'
import { getAppState, updateApp } from '../appStore'

export function findConversation(target: ComposeTarget): Conversation | undefined {
  return getAppState().conversations.find((c) =>
    target.kind === 'group' ? c.kind === 'group' && c.groupId === target.id : c.kind === target.kind && c.studentId === target.id,
  )
}

/** Qabul qiluvchi uchun yangi suhbat obyekti (store'ga qo'shilmaydi) */
export function buildConversation(target: ComposeTarget): Conversation | null {
  const state = getAppState()

  if (target.kind === 'group') {
    const group = state.groups.find((g) => g.id === target.id)
    if (!group) return null
    return {
      id: createId('cnv'),
      kind: 'group',
      groupId: group.id,
      title: `Guruh ${group.name}`,
      subtitle: group.course,
      color: group.color,
      pinned: false,
      unread: 0,
      messages: [],
    }
  }

  const student = state.students.find((s) => s.id === target.id)
  if (!student) return null
  const group = state.groups.find((g) => g.id === student.groupId)
  return {
    id: createId('cnv'),
    kind: target.kind,
    studentId: student.id,
    title: target.kind === 'parent' ? student.parentName || `${fullName(student)} ota-onasi` : fullName(student),
    subtitle: target.kind === 'parent' ? `${fullName(student)}ning ota-onasi` : group?.name ?? '',
    color: target.kind === 'parent' ? 'teal' : student.color,
    pinned: false,
    unread: 0,
    messages: [],
  }
}

/** Qabul qiluvchi uchun suhbatni topadi yoki yangisini yaratadi */
export function ensureConversation(target: ComposeTarget): Conversation | null {
  const existing = findConversation(target)
  if (existing) return existing
  const created = buildConversation(target)
  if (created) updateApp((s) => ({ ...s, conversations: [created, ...s.conversations] }))
  return created
}

export function sendMessage(conversationId: string, text: string): ChatMessage | null {
  const body = text.trim()
  if (!body) return null
  const message: ChatMessage = {
    id: createId('msg'),
    from: 'me',
    text: body,
    sentAt: new Date().toISOString(),
    read: false,
  }
  updateApp((state) => ({
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === conversationId ? { ...c, unread: 0, messages: [...c.messages, message] } : c,
    ),
  }))
  return message
}

/** Qabul qiluvchiga xabar yuborish (suhbat kerak bo'lsa yaratiladi) */
export function sendToTarget(target: ComposeTarget, text: string): string | null {
  const conversation = ensureConversation(target)
  if (!conversation) return null
  sendMessage(conversation.id, text)
  return conversation.id
}

export function markConversationRead(id: string): void {
  const conversation = getAppState().conversations.find((c) => c.id === id)
  if (!conversation || conversation.unread === 0) return
  updateApp((state) => ({
    ...state,
    conversations: state.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
  }))
}

export function markConversationUnread(id: string): void {
  updateApp((state) => ({
    ...state,
    conversations: state.conversations.map((c) => (c.id === id ? { ...c, unread: Math.max(1, c.unread) } : c)),
  }))
}

export function togglePinned(id: string): void {
  updateApp((state) => ({
    ...state,
    conversations: state.conversations.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
  }))
}

export function deleteConversation(id: string): void {
  updateApp((state) => ({ ...state, conversations: state.conversations.filter((c) => c.id !== id) }))
}

export function deleteMessage(conversationId: string, messageId: string): void {
  updateApp((state) => ({
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === conversationId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c,
    ),
  }))
}
