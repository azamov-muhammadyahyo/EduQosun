import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { config } from './config.js'
import type { ChatDTO, ChatType, ConversationKind, ConversationMeta, PeerType, Visibility } from './types.js'

/*
 * Kichik SQLite ombori (Node'ning ichki node:sqlite moduli — qo'shimcha o'rnatish shart emas).
 * Xabarlarning o'zi Telegramda saqlanadi; bu yerda faqat sessiya, ulangan chatlar va media keshi.
 */

const db = new DatabaseSync(path.join(config.dataDir, 'eduqosun.db'))

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS kv (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chats (
    conversation_id TEXT PRIMARY KEY,
    kind            TEXT NOT NULL,
    peer_type       TEXT NOT NULL,
    peer_id         TEXT NOT NULL,
    access_hash     TEXT,
    chat_type       TEXT NOT NULL,
    title           TEXT NOT NULL,
    username        TEXT,
    invite_link     TEXT,
    visibility      TEXT NOT NULL,
    members_count   INTEGER,
    meta            TEXT NOT NULL DEFAULT '{}',
    linked_at       TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS chats_peer ON chats (peer_type, peer_id);

  CREATE TABLE IF NOT EXISTS media (
    peer_key TEXT    NOT NULL,
    msg_id   INTEGER NOT NULL,
    variant  TEXT    NOT NULL,
    file     TEXT    NOT NULL,
    mime     TEXT    NOT NULL,
    name     TEXT,
    PRIMARY KEY (peer_key, msg_id, variant)
  );
`)

/* ———————————— Kalit–qiymat ———————————— */

export function kvGet(key: string): string | null {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function kvSet(key: string, value: string): void {
  db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
}

export function kvDelete(key: string): void {
  db.prepare('DELETE FROM kv WHERE key = ?').run(key)
}

/* ———————————— Ulangan chatlar ———————————— */

export interface ChatRecord {
  conversationId: string
  kind: ConversationKind
  peerType: PeerType
  peerId: string
  accessHash: string | null
  chatType: ChatType
  title: string
  username: string | null
  inviteLink: string | null
  visibility: Visibility
  membersCount: number | null
  meta: ConversationMeta
  linkedAt: string
}

interface ChatRow {
  conversation_id: string
  kind: string
  peer_type: string
  peer_id: string
  access_hash: string | null
  chat_type: string
  title: string
  username: string | null
  invite_link: string | null
  visibility: string
  members_count: number | null
  meta: string
  linked_at: string
}

function parseMeta(raw: string): ConversationMeta {
  try {
    const value: unknown = JSON.parse(raw)
    if (value && typeof value === 'object') return value as ConversationMeta
  } catch {
    /* buzilgan JSON */
  }
  return { title: '' }
}

function fromRow(row: ChatRow): ChatRecord {
  return {
    conversationId: row.conversation_id,
    kind: row.kind as ConversationKind,
    peerType: row.peer_type as PeerType,
    peerId: row.peer_id,
    accessHash: row.access_hash,
    chatType: row.chat_type as ChatType,
    title: row.title,
    username: row.username,
    inviteLink: row.invite_link,
    visibility: row.visibility as Visibility,
    membersCount: row.members_count,
    meta: parseMeta(row.meta),
    linkedAt: row.linked_at,
  }
}

export function listChats(): ChatRecord[] {
  return (db.prepare('SELECT * FROM chats ORDER BY linked_at').all() as unknown as ChatRow[]).map(fromRow)
}

export function getChat(conversationId: string): ChatRecord | null {
  const row = db.prepare('SELECT * FROM chats WHERE conversation_id = ?').get(conversationId) as unknown as ChatRow | undefined
  return row ? fromRow(row) : null
}

export function findChatsByPeer(peerType: PeerType, peerId: string): ChatRecord[] {
  return (db.prepare('SELECT * FROM chats WHERE peer_type = ? AND peer_id = ?').all(peerType, peerId) as unknown as ChatRow[]).map(fromRow)
}

export function saveChat(chat: ChatRecord): void {
  db.prepare(
    `INSERT INTO chats (conversation_id, kind, peer_type, peer_id, access_hash, chat_type, title, username, invite_link, visibility, members_count, meta, linked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(conversation_id) DO UPDATE SET
       kind = excluded.kind, peer_type = excluded.peer_type, peer_id = excluded.peer_id, access_hash = excluded.access_hash,
       chat_type = excluded.chat_type, title = excluded.title, username = excluded.username, invite_link = excluded.invite_link,
       visibility = excluded.visibility, members_count = excluded.members_count, meta = excluded.meta`,
  ).run(
    chat.conversationId,
    chat.kind,
    chat.peerType,
    chat.peerId,
    chat.accessHash,
    chat.chatType,
    chat.title,
    chat.username,
    chat.inviteLink,
    chat.visibility,
    chat.membersCount,
    JSON.stringify(chat.meta),
    chat.linkedAt,
  )
}

export function deleteChat(conversationId: string): void {
  db.prepare('DELETE FROM chats WHERE conversation_id = ?').run(conversationId)
}

export function deleteAllChats(): void {
  db.exec('DELETE FROM chats; DELETE FROM media;')
}

export function toChatDTO(chat: ChatRecord): ChatDTO {
  return {
    conversationId: chat.conversationId,
    kind: chat.kind,
    peerType: chat.peerType,
    chatType: chat.chatType,
    title: chat.title,
    username: chat.username,
    inviteLink: chat.inviteLink,
    visibility: chat.visibility,
    membersCount: chat.membersCount,
    linkedAt: chat.linkedAt,
    meta: chat.meta,
  }
}

/* ———————————— Media keshi ———————————— */

export interface MediaRecord {
  file: string
  mime: string
  name: string | null
}

export function getMedia(peerKey: string, msgId: number, variant: string): MediaRecord | null {
  const row = db.prepare('SELECT file, mime, name FROM media WHERE peer_key = ? AND msg_id = ? AND variant = ?').get(peerKey, msgId, variant) as
    | { file: string; mime: string; name: string | null }
    | undefined
  return row ?? null
}

export function saveMedia(peerKey: string, msgId: number, variant: string, media: MediaRecord): void {
  db.prepare(
    `INSERT INTO media (peer_key, msg_id, variant, file, mime, name) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(peer_key, msg_id, variant) DO UPDATE SET file = excluded.file, mime = excluded.mime, name = excluded.name`,
  ).run(peerKey, msgId, variant, media.file, media.mime, media.name)
}

export function forgetMedia(peerKey: string, msgId: number, variant: string): void {
  db.prepare('DELETE FROM media WHERE peer_key = ? AND msg_id = ? AND variant = ?').run(peerKey, msgId, variant)
}
