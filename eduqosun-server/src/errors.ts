import { errors } from 'telegram'

/** Panelga ko'rsatiladigan xato (xabar o'zbek tilida) */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = 'ERROR',
  ) {
    super(message)
  }
}

/** Sessiya bekor qilinganini bildiradigan Telegram kodlari */
export const AUTH_LOST_CODES = new Set([
  'AUTH_KEY_UNREGISTERED',
  'AUTH_KEY_DUPLICATED',
  'AUTH_KEY_INVALID',
  'SESSION_REVOKED',
  'SESSION_EXPIRED',
  'USER_DEACTIVATED',
  'USER_DEACTIVATED_BAN',
])

const FORBIDDEN_MEDIA = "Bu chatda bunday fayl yuborish taqiqlangan."

const telegramMessages: Record<string, string> = {
  API_ID_INVALID: "TG_API_ID yoki TG_API_HASH noto'g'ri. eduqosun-server/.env faylini tekshiring.",
  API_ID_PUBLISHED_FLOOD: "Bu API kalit bloklangan. my.telegram.org'da yangi ilova yarating.",
  PHONE_NUMBER_INVALID: "Telefon raqam noto'g'ri.",
  PHONE_NUMBER_BANNED: 'Bu raqam Telegramda bloklangan.',
  PHONE_NUMBER_UNOCCUPIED: "Bu raqam Telegramda ro'yxatdan o'tmagan.",
  PHONE_NUMBER_FLOOD: "Juda ko'p urinish bo'ldi. Birozdan so'ng qayta urinib ko'ring.",
  PHONE_PASSWORD_FLOOD: "Juda ko'p urinish bo'ldi. Birozdan so'ng qayta urinib ko'ring.",
  PHONE_CODE_INVALID: "Kod noto'g'ri.",
  PHONE_CODE_EMPTY: 'Kodni kiriting.',
  PHONE_CODE_EXPIRED: "Kodning muddati tugagan. Yangi kod so'rang.",
  PHONE_CODE_HASH_EMPTY: "Avval kod so'rang.",
  PASSWORD_HASH_INVALID: "Ikki bosqichli parol noto'g'ri.",
  SRP_ID_INVALID: "Parolni tekshirib bo'lmadi, qayta urinib ko'ring.",
  AUTH_KEY_UNREGISTERED: 'Telegram sessiyasi yopilgan. Akkauntni qayta ulang.',
  SESSION_REVOKED: 'Telegram sessiyasi yopilgan. Akkauntni qayta ulang.',
  USERNAME_INVALID: "Username noto'g'ri.",
  USERNAME_NOT_OCCUPIED: 'Bunday username topilmadi.',
  USERNAME_OCCUPIED: 'Bu username band. Boshqasini tanlang.',
  USERNAME_PURCHASE_AVAILABLE: 'Bu username band (Fragment’da sotuvda). Boshqasini tanlang.',
  USERNAMES_ACTIVE_TOO_MUCH: 'Faol username’lar soni limitga yetgan.',
  PHONE_NOT_OCCUPIED: 'Bu raqam Telegramda topilmadi.',
  INVITE_HASH_INVALID: "Taklif havolasi noto'g'ri.",
  INVITE_HASH_EMPTY: 'Taklif havolasini kiriting.',
  INVITE_HASH_EXPIRED: 'Taklif havolasining muddati tugagan yoki u bekor qilingan.',
  INVITE_REQUEST_SENT: "Qo'shilish so'rovi yuborildi. Guruh admini tasdiqlagach qayta urinib ko'ring.",
  CHANNELS_TOO_MUCH: "Siz juda ko'p guruh va kanallarga a'zosiz. Keraksizlaridan chiqing.",
  CHANNELS_ADMIN_PUBLIC_TOO_MUCH: 'Public guruhlaringiz soni limitga yetgan. Private guruh yarating.',
  CHANNEL_PRIVATE: 'Bu guruh yopiq yoki siz undan chiqarilgansiz.',
  CHANNEL_INVALID: 'Guruh topilmadi.',
  CHAT_ID_INVALID: 'Chat topilmadi.',
  PEER_ID_INVALID: 'Chat topilmadi. Havolani qayta ulang.',
  CHAT_TITLE_EMPTY: 'Guruh nomini kiriting.',
  CHAT_ABOUT_TOO_LONG: 'Guruh tavsifi juda uzun (255 belgigacha).',
  CHAT_WRITE_FORBIDDEN: "Bu chatga yozish huquqingiz yo'q.",
  CHAT_ADMIN_REQUIRED: 'Buning uchun guruhda admin bo’lishingiz kerak.',
  CHAT_RESTRICTED: 'Bu chat cheklangan.',
  CHAT_SEND_MEDIA_FORBIDDEN: FORBIDDEN_MEDIA,
  CHAT_SEND_PHOTOS_FORBIDDEN: FORBIDDEN_MEDIA,
  CHAT_SEND_VIDEOS_FORBIDDEN: FORBIDDEN_MEDIA,
  CHAT_SEND_DOCS_FORBIDDEN: FORBIDDEN_MEDIA,
  CHAT_SEND_AUDIOS_FORBIDDEN: FORBIDDEN_MEDIA,
  CHAT_SEND_VOICES_FORBIDDEN: 'Bu chatda ovozli xabar yuborish taqiqlangan.',
  CHAT_SEND_PLAIN_FORBIDDEN: 'Bu chatda matnli xabar yuborish taqiqlangan.',
  USER_BANNED_IN_CHANNEL: 'Siz bu guruhda yozishdan cheklangansiz.',
  PEER_FLOOD:
    "Telegram akkauntingizni spam gumoni bilan vaqtincha chekladi. Notanish odamlarga yozishni kamaytiring va @SpamBot orqali holatni tekshiring.",
  USER_PRIVACY_RESTRICTED: 'Foydalanuvchining maxfiylik sozlamalari bunga ruxsat bermaydi.',
  USER_IS_BLOCKED: 'Bu foydalanuvchi sizni bloklagan.',
  YOU_BLOCKED_USER: 'Siz bu foydalanuvchini bloklagansiz.',
  USER_IS_BOT: 'Bu bot akkaunti.',
  PRIVACY_PREMIUM_REQUIRED: 'Bu foydalanuvchiga faqat Telegram Premium orqali yozish mumkin.',
  VOICE_MESSAGES_FORBIDDEN: 'Foydalanuvchi ovozli xabarlarni qabul qilmaydi.',
  MESSAGE_TOO_LONG: 'Xabar juda uzun.',
  MESSAGE_EMPTY: "Xabar bo'sh.",
  MEDIA_CAPTION_TOO_LONG: 'Fayl izohi juda uzun.',
  MEDIA_EMPTY: "Fayl bo'sh yoki yaroqsiz.",
  MEDIA_INVALID: "Faylni yuborib bo'lmadi: format mos emas.",
  FILE_PARTS_INVALID: 'Faylni yuklashda xatolik yuz berdi.',
  FILE_PART_TOO_BIG: 'Faylni yuklashda xatolik yuz berdi.',
  FILE_REFERENCE_EXPIRED: "Fayl havolasi eskirgan, qayta urinib ko'ring.",
  MESSAGE_DELETE_FORBIDDEN: "Bu xabarni o'chirib bo'lmaydi.",
  MESSAGE_ID_INVALID: 'Xabar topilmadi.',
  MSG_ID_INVALID: 'Xabar topilmadi.',
  SLOWMODE_WAIT: "Guruhda sekin rejim yoqilgan. Birozdan so'ng yuboring.",
  TIMEOUT: "Telegram javob bermadi. Qayta urinib ko'ring.",
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} soniya`
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} daqiqa`
  return `${Math.ceil(seconds / 3600)} soat`
}

/** Istalgan xatoni panelga yuboriladigan ko'rinishga keltiradi */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error

  if (error instanceof errors.RPCError) {
    const code = error.errorMessage
    const seconds = (error as { seconds?: number }).seconds
    if (typeof seconds === 'number' && /FLOOD|SLOWMODE/.test(code)) {
      const prefix = code.startsWith('SLOWMODE') ? 'Guruhda sekin rejim yoqilgan.' : 'Telegram vaqtincha cheklov qo‘ydi.'
      return new AppError(429, `${prefix} ${formatWait(seconds)}dan so'ng qayta urinib ko'ring.`, code)
    }
    const base = code.replace(/_\d+$/, '')
    const message = telegramMessages[code] ?? telegramMessages[base] ?? `Telegram xatosi: ${code}`
    const status = AUTH_LOST_CODES.has(code) ? 401 : error.code === 403 ? 403 : 400
    return new AppError(status, message, code)
  }

  if (error instanceof Error && /TIMEOUT|Not connected|disconnected/i.test(error.message)) {
    return new AppError(503, "Telegram bilan aloqa yo'q. Internetni tekshirib, qayta urinib ko'ring.", 'NETWORK')
  }

  console.error(error)
  return new AppError(500, "Serverda kutilmagan xatolik yuz berdi.", 'INTERNAL')
}

export function telegramCode(error: unknown): string | null {
  return error instanceof errors.RPCError ? error.errorMessage : null
}
