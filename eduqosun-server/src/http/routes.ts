import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { Router, type Request } from 'express'
import multer from 'multer'
import { config, telegramConfigured } from '../config.js'
import { listChats, toChatDTO } from '../db.js'
import { AppError } from '../errors.js'
import { eventsHandler } from '../events.js'
import {
  createAndLinkGroup,
  linkGroup,
  linkUser,
  outboxStatus,
  queueSend,
  refreshChat,
  requireChat,
  unlink,
  updateMeta,
} from '../telegram/chats.js'
import { telegram } from '../telegram/client.js'
import { getMediaFile, removeQuietly } from '../telegram/media.js'
import { deleteMessages, fetchHistory, markRead, type FileMeta, type OutgoingFile } from '../telegram/messages.js'
import { previewGroupLink, resolveUser } from '../telegram/peers.js'
import type { ConversationKind, ConversationMeta, Visibility } from '../types.js'

export const router = Router()

/* ———————————— Kiruvchi ma'lumotni tekshirish ———————————— */

type Body = Record<string, unknown>

function body(req: Request): Body {
  return req.body && typeof req.body === 'object' ? (req.body as Body) : {}
}

function text(source: Body, key: string, max = 500): string {
  const value = source[key]
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function conversationIdOf(value: unknown): string {
  if (typeof value !== 'string' || !/^[\w-]{1,80}$/.test(value)) throw new AppError(400, "Suhbat ID noto'g'ri.", 'BAD_CONVERSATION')
  return value
}

function kindOf(value: unknown): ConversationKind {
  if (value === 'group' || value === 'student' || value === 'parent') return value
  throw new AppError(400, "Suhbat turi noto'g'ri.", 'BAD_KIND')
}

function metaOf(value: unknown): ConversationMeta {
  const source = value && typeof value === 'object' ? (value as Body) : {}
  const meta: ConversationMeta = { title: text(source, 'title', 120) }
  const subtitle = text(source, 'subtitle', 120)
  const groupId = text(source, 'groupId', 80)
  const studentId = text(source, 'studentId', 80)
  const color = text(source, 'color', 20)
  if (subtitle) meta.subtitle = subtitle
  if (groupId) meta.groupId = groupId
  if (studentId) meta.studentId = studentId
  if (color) meta.color = color
  return meta
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function finite(value: unknown, max: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(value, max) : undefined
}

/* ———————————— Umumiy ———————————— */

router.get('/health', (_req, res) => {
  res.json({ ok: true, telegramConfigured })
})

router.get('/events', eventsHandler)

/* ———————————— Akkaunt ———————————— */

router.get('/telegram/status', (_req, res) => {
  res.json(telegram.status())
})

router.post('/telegram/auth/code', async (req, res) => {
  res.json(await telegram.sendCode(text(body(req), 'phone', 32)))
})

router.post('/telegram/auth/sign-in', async (req, res) => {
  res.json(await telegram.signIn(text(body(req), 'code', 16)))
})

router.post('/telegram/auth/password', async (req, res) => {
  const password = body(req).password
  res.json(await telegram.checkPassword(typeof password === 'string' ? password.slice(0, 256) : ''))
})

router.post('/telegram/auth/cancel', async (_req, res) => {
  res.json(await telegram.cancelLogin())
})

router.post('/telegram/logout', async (_req, res) => {
  res.json(await telegram.logout())
})

router.get('/telegram/me/photo', async (_req, res) => {
  const photo = await telegram.accountAvatar()
  if (!photo) {
    res.status(404).end()
    return
  }
  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.type('image/jpeg').send(photo)
})

/* ———————————— Tekshirish (bog'lamasdan) ———————————— */

router.post('/telegram/lookup/group', async (req, res) => {
  const link = text(body(req), 'link', 300)
  res.json(await telegram.run((client) => previewGroupLink(client, link)))
})

router.post('/telegram/lookup/user', async (req, res) => {
  const source = body(req)
  const lookup = {
    username: text(source, 'username', 64),
    phone: text(source, 'phone', 32),
    firstName: text(source, 'firstName', 64),
    lastName: text(source, 'lastName', 64),
  }
  const resolved = await telegram.run((client) => resolveUser(client, lookup, source.addContact === true))
  res.json(resolved.preview)
})

/* ———————————— Ulangan chatlar ———————————— */

router.get('/telegram/chats', (_req, res) => {
  res.json(listChats().map(toChatDTO))
})

router.post('/telegram/chats/link-group', async (req, res) => {
  const source = body(req)
  const link = text(source, 'link', 300)
  if (!link) throw new AppError(400, 'Telegram havolasini kiriting.', 'LINK_EMPTY')
  res.json(await linkGroup(conversationIdOf(source.conversationId), metaOf(source.meta), link))
})

router.post('/telegram/chats/create-group', async (req, res) => {
  const source = body(req)
  const visibility: Visibility = source.visibility === 'public' ? 'public' : 'private'
  const result = await createAndLinkGroup(conversationIdOf(source.conversationId), metaOf(source.meta), {
    title: text(source, 'title', 128),
    about: text(source, 'about', 255),
    visibility,
    username: visibility === 'public' ? text(source, 'username', 64) : null,
  })
  res.json(result)
})

router.post('/telegram/chats/link-user', async (req, res) => {
  const source = body(req)
  const lookup = {
    username: text(source, 'username', 64),
    phone: text(source, 'phone', 32),
    firstName: text(source, 'firstName', 64),
    lastName: text(source, 'lastName', 64),
  }
  const kind = kindOf(source.kind)
  if (kind === 'group') throw new AppError(400, "Suhbat turi noto'g'ri.", 'BAD_KIND')
  res.json(await linkUser(conversationIdOf(source.conversationId), kind, metaOf(source.meta), lookup, source.addContact === true))
})

router.patch('/telegram/chats/:conversationId', (req, res) => {
  const chat = updateMeta(conversationIdOf(req.params.conversationId), metaOf(body(req).meta))
  res.json(toChatDTO(chat))
})

router.post('/telegram/chats/:conversationId/refresh', async (req, res) => {
  res.json(toChatDTO(await refreshChat(conversationIdOf(req.params.conversationId))))
})

router.delete('/telegram/chats/:conversationId', (req, res) => {
  unlink(conversationIdOf(req.params.conversationId))
  res.status(204).end()
})

router.get('/telegram/chats/:conversationId/messages', async (req, res) => {
  const chat = requireChat(conversationIdOf(req.params.conversationId))
  const minId = Number.parseInt(String(req.query.minId ?? '0'), 10) || 0
  const limit = Number.parseInt(String(req.query.limit ?? '50'), 10) || 50
  res.json(await telegram.run((client) => fetchHistory(client, chat, { minId, limit })))
})

router.post('/telegram/chats/:conversationId/read', async (req, res) => {
  const chat = requireChat(conversationIdOf(req.params.conversationId))
  await telegram.run((client) => markRead(client, chat))
  res.status(204).end()
})

router.post('/telegram/chats/:conversationId/delete-messages', async (req, res) => {
  const chat = requireChat(conversationIdOf(req.params.conversationId))
  const raw = body(req).ids
  const ids = Array.isArray(raw) ? raw.filter((id): id is number => Number.isInteger(id) && id > 0).slice(0, 100) : []
  if (!ids.length) throw new AppError(400, "O'chiriladigan xabar tanlanmagan.", 'IDS_EMPTY')
  await telegram.run((client) => deleteMessages(client, chat, ids))
  res.status(204).end()
})

/* ———————————— Xabar yuborish (multipart) ———————————— */

const MAX_FILES = 20

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).slice(0, 10)}`),
  }),
  limits: { fileSize: config.maxUploadBytes, files: MAX_FILES * 2 + 1, fields: 20, fieldSize: 64 * 1024 },
})

interface ClientFileMeta extends FileMeta {
  name?: string
}

router.post('/telegram/chats/:conversationId/messages', upload.any(), async (req, res) => {
  const uploaded = (req.files as Express.Multer.File[] | undefined) ?? []
  try {
    const conversationId = conversationIdOf(req.params.conversationId)
    requireChat(conversationId)
    const source = body(req)
    const clientId = text(source, 'clientId', 80) || randomUUID()
    const messageText = typeof source.text === 'string' ? source.text.slice(0, 20_000) : ''

    const files = uploaded.filter((f) => f.fieldname === 'files')
    if (files.length > MAX_FILES) throw new AppError(413, `Bir xabarda ${MAX_FILES} tagacha fayl yuborish mumkin.`, 'TOO_MANY_FILES')
    const metas = parseJson<ClientFileMeta[]>(source.meta, [])
    const thumbs = new Map(uploaded.filter((f) => f.fieldname.startsWith('thumb:')).map((f) => [Number(f.fieldname.slice(6)), f]))

    const outgoing: OutgoingFile[] = files.map((file, index) => {
      const meta = metas[index] ?? {}
      return {
        path: file.path,
        // Brauzer nomni UTF-8 da meta ichida yuboradi (multipart sarlavhasi latin1 bo'lishi mumkin)
        name: (typeof meta.name === 'string' && meta.name.trim().slice(0, 200)) || file.originalname,
        mime: file.mimetype || 'application/octet-stream',
        size: file.size,
        thumbPath: thumbs.get(index)?.path,
        meta: {
          width: finite(meta.width, 20_000),
          height: finite(meta.height, 20_000),
          duration: finite(meta.duration, 24 * 3600),
          asFile: meta.asFile === true,
        },
      }
    })

    const voiceFile = uploaded.find((f) => f.fieldname === 'voice')
    const voiceMeta = parseJson<{ duration?: number; waveform?: number[] }>(source.voiceMeta, {})
    const voice = voiceFile
      ? {
          path: voiceFile.path,
          duration: finite(voiceMeta.duration, 3600) ?? 1,
          waveform: Array.isArray(voiceMeta.waveform) ? voiceMeta.waveform.filter((v) => typeof v === 'number').slice(0, 100) : [],
        }
      : null

    if (!messageText.trim() && !outgoing.length && !voice) throw new AppError(400, "Xabar bo'sh.", 'MESSAGE_EMPTY')

    queueSend(conversationId, clientId, { text: messageText, files: outgoing, voice })
    res.status(202).json({ clientId })
  } catch (error) {
    await removeQuietly(...uploaded.map((f) => f.path))
    throw error
  }
})

router.get('/telegram/outbox', (req, res) => {
  const ids = String(req.query.ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => /^[\w-]{1,80}$/.test(id))
    .slice(0, 100)
  res.json(outboxStatus(ids))
})

/* ———————————— Media ———————————— */

router.get('/telegram/media/:conversationId/:msgId', async (req, res) => {
  const chat = requireChat(conversationIdOf(req.params.conversationId))
  const msgId = Number.parseInt(req.params.msgId, 10)
  if (!Number.isInteger(msgId) || msgId <= 0) throw new AppError(400, "Xabar ID noto'g'ri.", 'BAD_MESSAGE_ID')
  const variant = req.query.variant === 'thumb' ? 'thumb' : 'full'
  const media = await telegram.run((client) => getMediaFile(client, chat, msgId, variant))

  res.setHeader('Content-Type', media.mime)
  res.setHeader('Cache-Control', 'private, max-age=604800')
  if (req.query.download === '1') res.attachment(media.name ?? path.basename(media.file))
  res.sendFile(media.file)
})
