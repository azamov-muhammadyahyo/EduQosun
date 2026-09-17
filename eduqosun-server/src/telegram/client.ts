import os from 'node:os'
import { Api, Logger, TelegramClient, password as passwordUtils } from 'telegram'
import { LogLevel } from 'telegram/extensions/Logger.js'
import { StringSession } from 'telegram/sessions/index.js'
import { config, telegramConfigured } from '../config.js'
import { decrypt, encrypt } from '../crypto.js'
import { deleteAllChats, kvDelete, kvGet, kvSet } from '../db.js'
import { AUTH_LOST_CODES, AppError, telegramCode } from '../errors.js'
import { broadcast } from '../events.js'
import type { AccountDTO, AuthState, StatusDTO } from '../types.js'

/*
 * O'qituvchining shaxsiy Telegram akkaunti (MTProto, GramJS).
 * Kirish bosqichlari: telefon → kod → (ikki bosqichli parol) → ulangan.
 */

const SESSION_KEY = 'telegram.session'
const ACCOUNT_KEY = 'telegram.account'
const RESTORE_RETRY_MS = 30_000

interface PendingLogin {
  phone: string
  phoneCodeHash: string
  codeVia: 'app' | 'sms'
}

type ConnectedListener = (client: TelegramClient) => void

function createClient(session: string): TelegramClient {
  const client = new TelegramClient(new StringSession(session), config.apiId, config.apiHash, {
    connectionRetries: 5,
    autoReconnect: true,
    // Qisqa FLOOD_WAIT'larni kutib, so'rovni o'zi qaytaradi
    floodSleepThreshold: 90,
    deviceModel: 'EduQosun Panel',
    systemVersion: `${os.type()} ${os.release()}`,
    appVersion: '1.0.0',
    langCode: 'en',
    systemLangCode: 'en',
    baseLogger: new Logger(LogLevel.ERROR),
  })
  return client
}

function toAccount(user: Api.User): AccountDTO {
  return {
    id: user.id.toString(),
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    username: user.username ?? user.usernames?.find((u) => u.active)?.username ?? null,
    phone: user.phone ? `+${user.phone}` : null,
    premium: Boolean(user.premium),
  }
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 9) return `+998${digits}`
  return `+${digits}`
}

class TelegramService {
  private client: TelegramClient | null = null
  private state: AuthState = 'disconnected'
  private account: AccountDTO | null = null
  private pending: PendingLogin | null = null
  private passwordHint: string | null = null
  private listeners: ConnectedListener[] = []
  private accountPhoto: Buffer | null | undefined

  /** Ulangan holatga o'tganda (masalan, hodisa tinglovchilarini ulash uchun) */
  onConnected(listener: ConnectedListener): void {
    this.listeners.push(listener)
  }

  status(): StatusDTO {
    return {
      configured: telegramConfigured,
      state: this.state,
      account: this.account,
      phone: this.pending?.phone ?? null,
      codeVia: this.state === 'code' ? (this.pending?.codeVia ?? null) : null,
      passwordHint: this.state === 'password' ? this.passwordHint : null,
      maxUploadBytes: config.maxUploadBytes,
    }
  }

  private setState(state: AuthState): void {
    this.state = state
    broadcast('status', this.status())
  }

  /** Server ishga tushganda saqlangan sessiyani tiklaydi */
  async init(): Promise<void> {
    if (!telegramConfigured) return
    const stored = kvGet(SESSION_KEY)
    if (!stored) return
    const session = decrypt(stored)
    if (!session) {
      console.warn('Telegram sessiyasini ochib bo‘lmadi (shifrlash kaliti o‘zgargan). Akkauntni qayta ulang.')
      kvDelete(SESSION_KEY)
      return
    }
    const client = createClient(session)
    try {
      await client.connect()
      const me = await client.getMe()
      await this.becomeConnected(client, me)
      console.log(`Telegram ulandi: ${this.account?.firstName} (${this.account?.phone ?? ''})`)
    } catch (error) {
      await client.destroy().catch(() => undefined)
      const code = telegramCode(error)
      if (code && AUTH_LOST_CODES.has(code)) {
        console.warn('Telegram sessiyasi bekor qilingan. Akkauntni qayta ulang.')
        kvDelete(SESSION_KEY)
      } else {
        // Internet yo'q bo'lishi mumkin — birozdan so'ng qayta urinamiz
        console.warn('Telegramga ulanib bo‘lmadi, 30 soniyadan so‘ng qayta urinamiz:', error instanceof Error ? error.message : error)
        setTimeout(() => {
          if (this.state === 'disconnected' && !this.pending) void this.init()
        }, RESTORE_RETRY_MS)
      }
    }
  }

  /** Ulangan mijoz — aks holda 401 */
  requireClient(): TelegramClient {
    if (!telegramConfigured) throw new AppError(503, "Telegram kalitlari kiritilmagan (eduqosun-server/.env).", 'NOT_CONFIGURED')
    if (this.state !== 'connected' || !this.client) throw new AppError(401, 'Telegram akkaunti ulanmagan.', 'NOT_CONNECTED')
    return this.client
  }

  /** So'rovni bajaradi; sessiya bekor qilingan bo'lsa holatni tozalaydi */
  async run<T>(task: (client: TelegramClient) => Promise<T>): Promise<T> {
    const client = this.requireClient()
    try {
      return await task(client)
    } catch (error) {
      const code = telegramCode(error)
      if (code && AUTH_LOST_CODES.has(code)) await this.reset()
      throw error
    }
  }

  private async becomeConnected(client: TelegramClient, me: Api.User): Promise<void> {
    const account = toAccount(me)
    const previousAccount = kvGet(ACCOUNT_KEY)
    if (previousAccount && previousAccount !== account.id) {
      // Boshqa akkaunt — eski chat bog'lanishlari yaroqsiz
      deleteAllChats()
    }
    kvSet(ACCOUNT_KEY, account.id)
    kvSet(SESSION_KEY, encrypt((client.session as StringSession).save()))

    this.client = client
    this.account = account
    this.pending = null
    this.passwordHint = null
    this.accountPhoto = undefined
    // Yangilanishlar oqimini boshlash uchun
    await client.invoke(new Api.updates.GetState()).catch(() => undefined)
    for (const listener of this.listeners) listener(client)
    this.setState('connected')
  }

  private async loginClient(): Promise<TelegramClient> {
    if (!telegramConfigured) throw new AppError(503, "Telegram kalitlari kiritilmagan (eduqosun-server/.env).", 'NOT_CONFIGURED')
    if (this.state === 'connected') throw new AppError(409, 'Telegram akkaunti allaqachon ulangan.', 'ALREADY_CONNECTED')
    if (!this.client) {
      this.client = createClient('')
    }
    if (!this.client.connected) await this.client.connect()
    return this.client
  }

  async sendCode(phoneInput: string): Promise<StatusDTO> {
    const phone = normalizePhone(phoneInput)
    if (phone.length < 8) throw new AppError(400, "Telefon raqamni to'liq kiriting.", 'PHONE_NUMBER_INVALID')
    const client = await this.loginClient()
    const result = await client.sendCode({ apiId: config.apiId, apiHash: config.apiHash }, phone)
    this.pending = { phone, phoneCodeHash: result.phoneCodeHash, codeVia: result.isCodeViaApp ? 'app' : 'sms' }
    this.setState('code')
    return this.status()
  }

  async signIn(codeInput: string): Promise<StatusDTO> {
    const code = codeInput.replace(/\D/g, '')
    if (!this.pending || this.state !== 'code') throw new AppError(400, "Avval kod so'rang.", 'PHONE_CODE_HASH_EMPTY')
    if (!code) throw new AppError(400, 'Kodni kiriting.', 'PHONE_CODE_EMPTY')
    const client = await this.loginClient()
    try {
      const result = await client.invoke(
        new Api.auth.SignIn({ phoneNumber: this.pending.phone, phoneCodeHash: this.pending.phoneCodeHash, phoneCode: code }),
      )
      if (result instanceof Api.auth.AuthorizationSignUpRequired) {
        throw new AppError(400, "Bu raqam Telegramda ro'yxatdan o'tmagan. Avval Telegram ilovasida ro'yxatdan o'ting.", 'PHONE_NUMBER_UNOCCUPIED')
      }
      await this.becomeConnected(client, result.user as Api.User)
    } catch (error) {
      if (telegramCode(error) !== 'SESSION_PASSWORD_NEEDED') throw error
      const info = await client.invoke(new Api.account.GetPassword())
      this.passwordHint = info.hint ?? null
      this.setState('password')
    }
    return this.status()
  }

  async checkPassword(password: string): Promise<StatusDTO> {
    if (this.state !== 'password') throw new AppError(400, 'Parol so‘ralmagan.', 'BAD_STATE')
    if (!password) throw new AppError(400, 'Parolni kiriting.', 'PASSWORD_EMPTY')
    const client = await this.loginClient()
    const info = await client.invoke(new Api.account.GetPassword())
    const check = await passwordUtils.computeCheck(info, password)
    const result = await client.invoke(new Api.auth.CheckPassword({ password: check }))
    if (!(result instanceof Api.auth.Authorization)) throw new AppError(400, "Kirib bo'lmadi.", 'SIGN_IN_FAILED')
    await this.becomeConnected(client, result.user as Api.User)
    return this.status()
  }

  /** Kirish jarayonini bekor qilish (raqamni o'zgartirish) */
  async cancelLogin(): Promise<StatusDTO> {
    if (this.state === 'connected') return this.status()
    if (this.pending && this.client) {
      await this.client
        .invoke(new Api.auth.CancelCode({ phoneNumber: this.pending.phone, phoneCodeHash: this.pending.phoneCodeHash }))
        .catch(() => undefined)
    }
    this.pending = null
    this.passwordHint = null
    this.setState('disconnected')
    return this.status()
  }

  /** Akkauntdan chiqish: Telegram'dagi sessiya ham yopiladi */
  async logout(): Promise<StatusDTO> {
    const client = this.client
    if (client && this.state === 'connected') {
      await client.invoke(new Api.auth.LogOut()).catch(() => undefined)
    }
    await this.reset()
    return this.status()
  }

  private async reset(): Promise<void> {
    const client = this.client
    this.client = null
    this.account = null
    this.pending = null
    this.passwordHint = null
    this.accountPhoto = undefined
    kvDelete(SESSION_KEY)
    this.setState('disconnected')
    await client?.destroy().catch(() => undefined)
  }

  async accountAvatar(): Promise<Buffer | null> {
    if (this.accountPhoto !== undefined) return this.accountPhoto
    const photo = await this.run((client) => client.downloadProfilePhoto('me', { isBig: false }))
    this.accountPhoto = Buffer.isBuffer(photo) && photo.length > 0 ? photo : null
    return this.accountPhoto
  }

  async shutdown(): Promise<void> {
    await this.client?.destroy().catch(() => undefined)
  }
}

export const telegram = new TelegramService()
