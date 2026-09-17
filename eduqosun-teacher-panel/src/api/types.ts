/*
 * Server (eduqosun-server/src/types.ts) bilan almashiladigan ma'lumot turlari.
 * O'zgartirilsa ikkala faylni ham yangilang.
 */

export type AuthState = 'disconnected' | 'code' | 'password' | 'connected'

export interface AccountDTO {
  id: string
  firstName: string
  lastName: string
  username: string | null
  phone: string | null
  premium: boolean
}

export interface StatusDTO {
  configured: boolean
  state: AuthState
  account: AccountDTO | null
  /** Kod qaysi raqamga va qayerga yuborilgan (state = code) */
  phone: string | null
  codeVia: 'app' | 'sms' | null
  /** Ikki bosqichli parol uchun eslatma (state = password) */
  passwordHint: string | null
  /** Bir faylning eng katta hajmi, bayt */
  maxUploadBytes: number
}

export type ConversationKind = 'group' | 'student' | 'parent'
export type PeerType = 'channel' | 'chat' | 'user'
export type Visibility = 'private' | 'public'
export type ChatType = 'group' | 'supergroup' | 'channel' | 'user'

/** Panel suhbatini qayta tiklash uchun saqlanadigan ma'lumot */
export interface ConversationMeta {
  title: string
  subtitle?: string
  groupId?: string
  studentId?: string
  color?: string
}

export interface ChatDTO {
  conversationId: string
  kind: ConversationKind
  peerType: PeerType
  chatType: ChatType
  title: string
  username: string | null
  inviteLink: string | null
  visibility: Visibility
  membersCount: number | null
  linkedAt: string
  meta: ConversationMeta
}

/** Havola yoki foydalanuvchini tekshirish natijasi */
export interface ChatPreviewDTO {
  title: string
  chatType: ChatType
  visibility: Visibility
  username: string | null
  inviteLink: string | null
  membersCount: number | null
  isMember: boolean
  canWrite: boolean
  /** Qo'shilish uchun admin tasdig'i kerak */
  joinRequest: boolean
  phone: string | null
}

export type AttachmentKind = 'photo' | 'video' | 'voice' | 'audio' | 'file'

export interface AttachmentDTO {
  tgId: number
  kind: AttachmentKind
  url: string
  thumbUrl?: string
  name?: string
  mime?: string
  size?: number
  duration?: number
  width?: number
  height?: number
  /** 0–31 oralig'idagi qiymatlar (ovozli xabar to'lqini) */
  waveform?: number[]
}

export interface MessageDTO {
  /** Suhbat ichida barqaror ID: "tg-<birinchi xabar ID>" */
  id: string
  tgIds: number[]
  albumId?: string
  from: 'me' | 'them'
  author?: string
  text: string
  sentAt: string
  editedAt?: string
  read: boolean
  attachments: AttachmentDTO[]
}

export interface HistoryDTO {
  messages: MessageDTO[]
  unread: number
  readOutboxMaxId: number
}

export interface LinkResultDTO {
  chat: ChatDTO
  history: HistoryDTO
  warning?: string
}

export interface OutboxResultDTO {
  clientId: string
  /** unknown — server qayta ishga tushgan, natija yo'qolgan */
  status: 'pending' | 'sent' | 'failed' | 'unknown'
  messages?: MessageDTO[]
  error?: string
}

/** SSE orqali panelga yuboriladigan hodisalar */
export interface ServerEvents {
  status: StatusDTO
  'message:new': { conversationId: string; message: MessageDTO }
  'message:edit': { conversationId: string; message: MessageDTO }
  'message:sent': { conversationId: string; clientId: string; messages: MessageDTO[] }
  'message:progress': { conversationId: string; clientId: string; progress: number }
  'message:failed': { conversationId: string; clientId: string; error: string }
  'message:delete': { conversationIds: string[]; ids: number[] }
  'message:read': { conversationId: string; maxId: number }
  'chat:read': { conversationId: string; unread: number }
  'chat:removed': { conversationId: string }
}
