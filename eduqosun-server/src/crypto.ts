import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { config } from './config.js'

/*
 * Telegram sessiyasi akkauntga to'liq kirish beradi, shuning uchun bazada faqat
 * shifrlangan holda (AES-256-GCM) saqlanadi. Kalit .env dagi SESSION_SECRET dan,
 * u bo'lmasa data/secret.key faylidan olinadi (birinchi ishga tushishda yaratiladi).
 */

function loadSecret(): string {
  if (config.sessionSecret) return config.sessionSecret
  const file = path.join(config.dataDir, 'secret.key')
  if (existsSync(file)) return readFileSync(file, 'utf8').trim()
  const secret = randomBytes(32).toString('hex')
  writeFileSync(file, secret, { mode: 0o600 })
  return secret
}

const key = scryptSync(loadSecret(), 'eduqosun-telegram-session', 32)

export function encrypt(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64')).join('.')
}

/** Kalit o'zgargan yoki qiymat buzilgan bo'lsa — null */
export function decrypt(payload: string): string | null {
  try {
    const [iv, tag, data] = payload.split('.').map((part) => Buffer.from(part, 'base64'))
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
