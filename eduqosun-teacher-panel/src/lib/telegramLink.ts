/*
 * Telegram havolasini panelning o'zida tekshirish (server ham xuddi shunday tekshiradi —
 * eduqosun-server/src/telegram/peers.ts → parseTelegramLink).
 */

export type ParsedTelegramLink = { kind: 'username'; username: string } | { kind: 'invite'; hash: string }

export const TELEGRAM_USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/
const HASH_RE = /^[\w-]{8,}$/

export function parseTelegramLink(input: string): ParsedTelegramLink | null {
  let value = input.trim()
  if (!value) return null

  const tgJoin = /^tg:\/\/join\?invite=([\w-]+)/i.exec(value)
  if (tgJoin) return { kind: 'invite', hash: tgJoin[1] }
  const tgResolve = /^tg:\/\/resolve\?domain=(\w+)/i.exec(value)
  if (tgResolve) return TELEGRAM_USERNAME_RE.test(tgResolve[1]) ? { kind: 'username', username: tgResolve[1] } : null

  if (value.startsWith('@')) {
    const username = value.slice(1)
    return TELEGRAM_USERNAME_RE.test(username) ? { kind: 'username', username } : null
  }

  value = value.replace(/^https?:\/\//i, '').replace(/^www\./i, '')

  const subdomain = /^(\w+)\.t\.me\/?$/i.exec(value)
  if (subdomain) return TELEGRAM_USERNAME_RE.test(subdomain[1]) ? { kind: 'username', username: subdomain[1] } : null

  const match = /^(?:t\.me|telegram\.me|telegram\.dog)\/(.+)$/i.exec(value)
  if (match) {
    const [first, second] = match[1].split(/[?#]/)[0].split('/')
    if (first.startsWith('+')) return HASH_RE.test(first.slice(1)) ? { kind: 'invite', hash: first.slice(1) } : null
    if (first.toLowerCase() === 'joinchat' && second) return HASH_RE.test(second) ? { kind: 'invite', hash: second } : null
    if (first.toLowerCase() === 's' && second) return TELEGRAM_USERNAME_RE.test(second) ? { kind: 'username', username: second } : null
    return TELEGRAM_USERNAME_RE.test(first) ? { kind: 'username', username: first } : null
  }

  return TELEGRAM_USERNAME_RE.test(value) ? { kind: 'username', username: value } : null
}

/** Chatni Telegramda ochish uchun manzil */
export function telegramOpenUrl(link: { username: string | null; inviteLink: string | null }): string | null {
  if (link.username) return `https://t.me/${link.username}`
  return link.inviteLink
}
