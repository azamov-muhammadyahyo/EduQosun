import { API_BASE, api, uploadForm } from './http'
import type {
  ChatDTO,
  ChatPreviewDTO,
  ConversationKind,
  ConversationMeta,
  HistoryDTO,
  LinkResultDTO,
  OutboxResultDTO,
  StatusDTO,
  Visibility,
} from './types'

/* eduqosun-server Telegram API'si */

const chatPath = (conversationId: string) => `/telegram/chats/${encodeURIComponent(conversationId)}`

export const telegramApi = {
  status: () => api<StatusDTO>('/telegram/status'),
  sendCode: (phone: string) => api<StatusDTO>('/telegram/auth/code', { json: { phone } }),
  signIn: (code: string) => api<StatusDTO>('/telegram/auth/sign-in', { json: { code } }),
  checkPassword: (password: string) => api<StatusDTO>('/telegram/auth/password', { json: { password } }),
  cancelLogin: () => api<StatusDTO>('/telegram/auth/cancel', { json: {} }),
  logout: () => api<StatusDTO>('/telegram/logout', { json: {} }),
  accountPhotoUrl: `${API_BASE}/telegram/me/photo`,

  lookupGroup: (link: string) => api<ChatPreviewDTO>('/telegram/lookup/group', { json: { link } }),
  lookupUser: (input: UserLookupInput) => api<ChatPreviewDTO>('/telegram/lookup/user', { json: input }),

  chats: () => api<ChatDTO[]>('/telegram/chats'),
  linkGroup: (input: { conversationId: string; meta: ConversationMeta; link: string }) =>
    api<LinkResultDTO>('/telegram/chats/link-group', { json: input }),
  createGroup: (input: { conversationId: string; meta: ConversationMeta; title: string; about: string; visibility: Visibility; username: string }) =>
    api<LinkResultDTO>('/telegram/chats/create-group', { json: input }),
  linkUser: (input: UserLookupInput & { conversationId: string; kind: ConversationKind; meta: ConversationMeta }) =>
    api<LinkResultDTO>('/telegram/chats/link-user', { json: input }),
  updateMeta: (conversationId: string, meta: ConversationMeta) => api<ChatDTO>(chatPath(conversationId), { method: 'PATCH', json: { meta } }),
  refresh: (conversationId: string) => api<ChatDTO>(`${chatPath(conversationId)}/refresh`, { json: {} }),
  unlink: (conversationId: string) => api<void>(chatPath(conversationId), { method: 'DELETE' }),

  history: (conversationId: string, minId: number, limit: number) =>
    api<HistoryDTO>(`${chatPath(conversationId)}/messages?minId=${minId}&limit=${limit}`),
  markRead: (conversationId: string) => api<void>(`${chatPath(conversationId)}/read`, { json: {} }),
  deleteMessages: (conversationId: string, ids: number[]) => api<void>(`${chatPath(conversationId)}/delete-messages`, { json: { ids } }),
  outbox: (clientIds: string[]) => api<OutboxResultDTO[]>(`/telegram/outbox?ids=${clientIds.map(encodeURIComponent).join(',')}`),

  send: (conversationId: string, form: FormData, onProgress?: (fraction: number) => void) =>
    uploadForm<{ clientId: string }>(`${chatPath(conversationId)}/messages`, form, onProgress),
}

export interface UserLookupInput {
  username?: string
  phone?: string
  firstName?: string
  lastName?: string
  addContact?: boolean
}

export function mediaDownloadUrl(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}download=1`
}
