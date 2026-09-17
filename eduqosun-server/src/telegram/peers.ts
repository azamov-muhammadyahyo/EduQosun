import bigInt from 'big-integer'
import { Api, type TelegramClient } from 'telegram'
import { generateRandomLong } from 'telegram/Helpers.js'
import type { ChatRecord } from '../db.js'
import { AppError, telegramCode } from '../errors.js'
import type { ChatPreviewDTO, ChatType, PeerType, Visibility } from '../types.js'

/* ———————————— Peer (chat manzili) ———————————— */

export interface StoredPeer {
  type: PeerType
  id: string
  accessHash: string | null
}

export function toInputPeer(peer: Pick<ChatRecord, 'peerType' | 'peerId' | 'accessHash'>): Api.TypeInputPeer {
  const id = bigInt(peer.peerId)
  const accessHash = bigInt(peer.accessHash ?? '0')
  switch (peer.peerType) {
    case 'channel':
      return new Api.InputPeerChannel({ channelId: id, accessHash })
    case 'chat':
      return new Api.InputPeerChat({ chatId: id })
    case 'user':
      return new Api.InputPeerUser({ userId: id, accessHash })
  }
}

export function peerKey(type: PeerType, id: string): string {
  return `${type}:${id}`
}

export function chatPeerKey(chat: Pick<ChatRecord, 'peerType' | 'peerId'>): string {
  return peerKey(chat.peerType, chat.peerId)
}

/** Xabar kelgan chat: PeerChannel / PeerChat / PeerUser → [tur, id] */
export function peerOf(peer: Api.TypePeer): [PeerType, string] {
  if (peer instanceof Api.PeerChannel) return ['channel', peer.channelId.toString()]
  if (peer instanceof Api.PeerChat) return ['chat', peer.chatId.toString()]
  return ['user', peer.userId.toString()]
}

type GroupEntity = Api.Channel | Api.Chat
type AnyEntity = GroupEntity | Api.User

function storedPeerOf(entity: AnyEntity): StoredPeer {
  if (entity instanceof Api.Channel) return { type: 'channel', id: entity.id.toString(), accessHash: entity.accessHash?.toString() ?? null }
  if (entity instanceof Api.Chat) return { type: 'chat', id: entity.id.toString(), accessHash: null }
  return { type: 'user', id: entity.id.toString(), accessHash: entity.accessHash?.toString() ?? null }
}

function activeUsername(entity: Api.Channel | Api.User): string | null {
  return entity.username ?? entity.usernames?.find((u) => u.active)?.username ?? null
}

export function displayName(entity: unknown): string {
  if (entity instanceof Api.User) return [entity.firstName, entity.lastName].filter(Boolean).join(' ') || (entity.username ?? 'Foydalanuvchi')
  if (entity instanceof Api.Channel || entity instanceof Api.Chat) return entity.title
  return ''
}

/* ———————————— Havolani tahlil qilish ———————————— */

export type ParsedLink = { kind: 'username'; username: string } | { kind: 'invite'; hash: string }

const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/
const HASH_RE = /^[\w-]{8,}$/

/**
 * Qabul qilinadigan ko'rinishlar:
 *  https://t.me/+AbCd…, t.me/joinchat/AbCd…, tg://join?invite=AbCd…  → private
 *  https://t.me/guruh, @guruh, guruh.t.me, tg://resolve?domain=guruh → public
 */
export function parseTelegramLink(input: string): ParsedLink | null {
  let value = input.trim()
  if (!value) return null

  const tgJoin = /^tg:\/\/join\?invite=([\w-]+)/i.exec(value)
  if (tgJoin) return { kind: 'invite', hash: tgJoin[1] }
  const tgResolve = /^tg:\/\/resolve\?domain=([\w]+)/i.exec(value)
  if (tgResolve) return USERNAME_RE.test(tgResolve[1]) ? { kind: 'username', username: tgResolve[1] } : null

  if (value.startsWith('@')) {
    const username = value.slice(1)
    return USERNAME_RE.test(username) ? { kind: 'username', username } : null
  }

  value = value.replace(/^https?:\/\//i, '').replace(/^www\./i, '')

  const subdomain = /^([\w]+)\.t\.me\/?$/i.exec(value)
  if (subdomain) return USERNAME_RE.test(subdomain[1]) ? { kind: 'username', username: subdomain[1] } : null

  const match = /^(?:t\.me|telegram\.me|telegram\.dog)\/(.+)$/i.exec(value)
  if (match) {
    const pathPart = match[1].split(/[?#]/)[0]
    const [first, second] = pathPart.split('/')
    if (first.startsWith('+')) {
      const hash = first.slice(1)
      return HASH_RE.test(hash) ? { kind: 'invite', hash } : null
    }
    if (first.toLowerCase() === 'joinchat' && second) return HASH_RE.test(second) ? { kind: 'invite', hash: second } : null
    if (first.toLowerCase() === 's' && second) return USERNAME_RE.test(second) ? { kind: 'username', username: second } : null
    return USERNAME_RE.test(first) ? { kind: 'username', username: first } : null
  }

  return USERNAME_RE.test(value) ? { kind: 'username', username: value } : null
}

export function inviteLinkOf(link: ParsedLink): string {
  return link.kind === 'invite' ? `https://t.me/+${link.hash}` : `https://t.me/${link.username}`
}

const INVALID_LINK = new AppError(
  400,
  "Havola noto'g'ri. Masalan: https://t.me/+AbCdEf12345 (private) yoki https://t.me/guruh_nomi (public).",
  'LINK_INVALID',
)

/* ———————————— Guruh ma'lumotlari ———————————— */

function chatTypeOf(entity: AnyEntity): ChatType {
  if (entity instanceof Api.User) return 'user'
  if (entity instanceof Api.Chat) return 'group'
  return entity.broadcast ? 'channel' : 'supergroup'
}

function canWriteTo(entity: GroupEntity): boolean {
  if (entity instanceof Api.Chat) return !entity.deactivated && !entity.defaultBannedRights?.sendMessages
  if (entity.creator || entity.adminRights?.postMessages) return true
  if (entity.broadcast) return false
  if (entity.bannedRights?.sendMessages) return false
  if (entity.defaultBannedRights?.sendMessages && !entity.adminRights) return false
  return true
}

async function membersCountOf(client: TelegramClient, entity: GroupEntity): Promise<number | null> {
  try {
    if (entity instanceof Api.Chat) return entity.participantsCount ?? null
    if (entity.participantsCount) return entity.participantsCount
    const full = await client.invoke(new Api.channels.GetFullChannel({ channel: new Api.InputChannel({ channelId: entity.id, accessHash: entity.accessHash ?? bigInt.zero }) }))
    return full.fullChat instanceof Api.ChannelFull ? (full.fullChat.participantsCount ?? null) : null
  } catch {
    return null
  }
}

export interface ResolvedChat {
  peer: StoredPeer
  preview: ChatPreviewDTO
}

async function describeGroup(client: TelegramClient, entity: GroupEntity, isMember: boolean, link: ParsedLink | null): Promise<ResolvedChat> {
  const username = entity instanceof Api.Channel ? activeUsername(entity) : null
  const visibility: Visibility = username ? 'public' : 'private'
  const inviteLink = username ? `https://t.me/${username}` : link?.kind === 'invite' ? inviteLinkOf(link) : null
  return {
    peer: storedPeerOf(entity),
    preview: {
      title: entity.title,
      chatType: chatTypeOf(entity),
      visibility,
      username,
      inviteLink,
      membersCount: await membersCountOf(client, entity),
      isMember,
      canWrite: isMember ? canWriteTo(entity) : true,
      joinRequest: entity instanceof Api.Channel ? Boolean(entity.joinRequest) : false,
      phone: null,
    },
  }
}

/** Eski oddiy guruh supergroup'ga aylangan bo'lsa — yangisini qaytaradi */
async function upgradeIfMigrated(client: TelegramClient, entity: GroupEntity): Promise<GroupEntity> {
  if (!(entity instanceof Api.Chat) || !(entity.migratedTo instanceof Api.InputChannel)) return entity
  const result = await client.invoke(new Api.channels.GetChannels({ id: [entity.migratedTo] }))
  const channel = result.chats.find((c): c is Api.Channel => c instanceof Api.Channel)
  return channel ?? entity
}

function groupFromChats(chats: Api.TypeChat[]): GroupEntity | null {
  return chats.find((c): c is GroupEntity => c instanceof Api.Channel || c instanceof Api.Chat) ?? null
}

async function resolveUsernameEntity(client: TelegramClient, username: string): Promise<AnyEntity> {
  const result = await client.invoke(new Api.contacts.ResolveUsername({ username }))
  const [type, id] = peerOf(result.peer)
  const entity =
    type === 'user'
      ? result.users.find((u): u is Api.User => u instanceof Api.User && u.id.toString() === id)
      : result.chats.find((c): c is GroupEntity => (c instanceof Api.Channel || c instanceof Api.Chat) && c.id.toString() === id)
  if (!entity) throw new AppError(404, 'Bunday username topilmadi.', 'USERNAME_NOT_OCCUPIED')
  return entity
}

function requireGroupLink(input: string): ParsedLink {
  const link = parseTelegramLink(input)
  if (!link) throw INVALID_LINK
  return link
}

/** Havolani tekshiradi (guruhga qo'shilmasdan) */
export async function previewGroupLink(client: TelegramClient, input: string): Promise<ChatPreviewDTO> {
  const link = requireGroupLink(input)

  if (link.kind === 'invite') {
    const invite = await client.invoke(new Api.messages.CheckChatInvite({ hash: link.hash }))
    if (invite instanceof Api.ChatInviteAlready) {
      const entity = groupFromChats([invite.chat])
      if (!entity) throw new AppError(404, 'Guruh topilmadi.', 'CHAT_NOT_FOUND')
      return (await describeGroup(client, await upgradeIfMigrated(client, entity), true, link)).preview
    }
    if (invite instanceof Api.ChatInvitePeek) {
      const entity = groupFromChats([invite.chat])
      if (!entity) throw new AppError(404, 'Guruh topilmadi.', 'CHAT_NOT_FOUND')
      return (await describeGroup(client, entity, false, link)).preview
    }
    return {
      title: invite.title,
      chatType: invite.broadcast ? 'channel' : invite.megagroup ? 'supergroup' : 'group',
      visibility: invite.public ? 'public' : 'private',
      username: null,
      inviteLink: inviteLinkOf(link),
      membersCount: invite.participantsCount,
      isMember: false,
      canWrite: !invite.broadcast,
      joinRequest: Boolean(invite.requestNeeded),
      phone: null,
    }
  }

  const entity = await resolveUsernameEntity(client, link.username)
  if (entity instanceof Api.User) throw new AppError(400, "Bu havola foydalanuvchiga tegishli, guruhga emas.", 'NOT_A_GROUP')
  const isMember = entity instanceof Api.Channel ? !entity.left : true
  return (await describeGroup(client, entity, isMember, link)).preview
}

/** Havola bo'yicha guruhni topadi, kerak bo'lsa a'zo bo'ladi */
export async function joinGroupByLink(client: TelegramClient, input: string): Promise<ResolvedChat> {
  const link = requireGroupLink(input)
  let entity: GroupEntity | null = null

  if (link.kind === 'invite') {
    const invite = await client.invoke(new Api.messages.CheckChatInvite({ hash: link.hash }))
    if (invite instanceof Api.ChatInviteAlready) {
      entity = groupFromChats([invite.chat])
    } else {
      try {
        const updates = await client.invoke(new Api.messages.ImportChatInvite({ hash: link.hash }))
        entity = 'chats' in updates ? groupFromChats(updates.chats) : null
      } catch (error) {
        if (telegramCode(error) !== 'USER_ALREADY_PARTICIPANT') throw error
        const again = await client.invoke(new Api.messages.CheckChatInvite({ hash: link.hash }))
        entity = again instanceof Api.ChatInviteAlready ? groupFromChats([again.chat]) : null
      }
    }
  } else {
    const resolved = await resolveUsernameEntity(client, link.username)
    if (resolved instanceof Api.User) throw new AppError(400, "Bu havola foydalanuvchiga tegishli, guruhga emas.", 'NOT_A_GROUP')
    entity = resolved
    if (entity instanceof Api.Channel && entity.left) {
      const channel = new Api.InputChannel({ channelId: entity.id, accessHash: entity.accessHash ?? bigInt.zero })
      const updates = await client.invoke(new Api.channels.JoinChannel({ channel }))
      entity = ('chats' in updates ? groupFromChats(updates.chats) : null) ?? entity
    }
  }

  if (!entity) throw new AppError(404, 'Guruh topilmadi.', 'CHAT_NOT_FOUND')
  entity = await upgradeIfMigrated(client, entity)
  const resolved = await describeGroup(client, entity, true, link)
  if (!resolved.preview.canWrite) {
    throw new AppError(403, resolved.preview.chatType === 'channel' ? "Bu kanalga post yozish huquqingiz yo'q." : "Bu guruhga yozish huquqingiz yo'q.", 'CHAT_WRITE_FORBIDDEN')
  }
  return resolved
}

/* ———————————— Yangi guruh yaratish ———————————— */

export interface CreateGroupInput {
  title: string
  about: string
  visibility: Visibility
  username: string | null
}

export async function createGroup(client: TelegramClient, input: CreateGroupInput): Promise<ResolvedChat & { warning?: string }> {
  const title = input.title.trim()
  if (!title) throw new AppError(400, 'Guruh nomini kiriting.', 'CHAT_TITLE_EMPTY')
  const username = input.visibility === 'public' ? (input.username ?? '').trim().replace(/^@/, '') : null
  if (username !== null) {
    if (!USERNAME_RE.test(username)) {
      throw new AppError(400, "Username 5–32 ta lotin harfi, raqam yoki _ belgisidan iborat bo'lsin va harf bilan boshlansin.", 'USERNAME_INVALID')
    }
    const free = await client.invoke(new Api.channels.CheckUsername({ channel: new Api.InputChannelEmpty(), username }))
    if (!free) throw new AppError(400, 'Bu username band. Boshqasini tanlang.', 'USERNAME_OCCUPIED')
  }

  const updates = await client.invoke(new Api.channels.CreateChannel({ title, about: input.about.trim().slice(0, 255), megagroup: true }))
  const channel = 'chats' in updates ? updates.chats.find((c): c is Api.Channel => c instanceof Api.Channel) : undefined
  if (!channel) throw new AppError(500, "Guruh yaratildi, lekin ma'lumotini olib bo'lmadi. Telegramni tekshiring.", 'CREATE_FAILED')
  const inputChannel = new Api.InputChannel({ channelId: channel.id, accessHash: channel.accessHash ?? bigInt.zero })

  let warning: string | undefined
  if (username) {
    try {
      await client.invoke(new Api.channels.UpdateUsername({ channel: inputChannel, username }))
      channel.username = username
    } catch (error) {
      warning = `Guruh private holda yaratildi: username o'rnatilmadi (${telegramCode(error) ?? 'xato'}).`
    }
  }

  const resolved = await describeGroup(client, channel, true, null)
  if (resolved.preview.visibility === 'private') {
    const exported = await client.invoke(new Api.messages.ExportChatInvite({ peer: new Api.InputPeerChannel({ channelId: channel.id, accessHash: channel.accessHash ?? bigInt.zero }) }))
    if (exported instanceof Api.ChatInviteExported) resolved.preview.inviteLink = exported.link
  }
  return { ...resolved, warning }
}

/* ———————————— Foydalanuvchi (o'quvchi / ota-ona) ———————————— */

export interface UserLookup {
  username?: string
  phone?: string
  firstName?: string
  lastName?: string
}

function describeUser(user: Api.User): ResolvedChat {
  const username = activeUsername(user)
  return {
    peer: storedPeerOf(user),
    preview: {
      title: displayName(user),
      chatType: 'user',
      visibility: 'private',
      username,
      inviteLink: username ? `https://t.me/${username}` : null,
      membersCount: null,
      isMember: true,
      canWrite: !user.deleted,
      joinRequest: false,
      phone: user.phone ? `+${user.phone}` : null,
    },
  }
}

function normalizeUserPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  return digits.length === 9 ? `998${digits}` : digits
}

/**
 * Username yoki telefon raqam bo'yicha Telegram foydalanuvchisini topadi.
 * Raqam maxfiy bo'lsa, u kontaktlarga qo'shib ko'riladi (addContact = true bo'lganda).
 */
export async function resolveUser(client: TelegramClient, lookup: UserLookup, addContact: boolean): Promise<ResolvedChat> {
  const username = lookup.username?.trim().replace(/^@/, '').replace(/^(https?:\/\/)?t\.me\//i, '')
  if (username) {
    if (!USERNAME_RE.test(username)) throw new AppError(400, "Username noto'g'ri.", 'USERNAME_INVALID')
    const entity = await resolveUsernameEntity(client, username)
    if (!(entity instanceof Api.User)) throw new AppError(400, 'Bu username guruh yoki kanalga tegishli.', 'NOT_A_USER')
    return describeUser(entity)
  }

  const phone = normalizeUserPhone(lookup.phone ?? '')
  if (phone.length < 9) throw new AppError(400, 'Telefon raqam yoki username kiriting.', 'LOOKUP_EMPTY')

  try {
    const result = await client.invoke(new Api.contacts.ResolvePhone({ phone }))
    const user = result.users.find((u): u is Api.User => u instanceof Api.User)
    if (user) return describeUser(user)
  } catch (error) {
    const code = telegramCode(error)
    if (code !== 'PHONE_NOT_OCCUPIED' && code !== 'PHONE_NUMBER_INVALID') throw error
  }

  if (addContact) {
    const imported = await client.invoke(
      new Api.contacts.ImportContacts({
        contacts: [
          new Api.InputPhoneContact({
            clientId: generateRandomLong(),
            phone,
            firstName: lookup.firstName?.trim() || `+${phone}`,
            lastName: lookup.lastName?.trim() ?? '',
          }),
        ],
      }),
    )
    const user = imported.users.find((u): u is Api.User => u instanceof Api.User)
    if (user) return describeUser(user)
  }

  throw new AppError(
    404,
    addContact
      ? "Bu raqam Telegramda topilmadi yoki foydalanuvchi raqamini yashirgan. Username orqali urinib ko'ring."
      : "Raqam bo'yicha topilmadi (foydalanuvchi raqamini yashirgan bo'lishi mumkin). Username orqali urinib ko'ring yoki «Kontaktga qo'shib qidirish»ni yoqing.",
    'USER_NOT_FOUND',
  )
}

/** Saqlangan chatning joriy nomi va a'zolar sonini yangilash */
export async function refreshChatInfo(client: TelegramClient, chat: ChatRecord): Promise<Partial<ChatRecord>> {
  const peer = toInputPeer(chat)
  if (peer instanceof Api.InputPeerUser) {
    const [user] = await client.invoke(new Api.users.GetUsers({ id: [new Api.InputUser({ userId: peer.userId, accessHash: peer.accessHash })] }))
    if (!(user instanceof Api.User)) return {}
    const { preview } = describeUser(user)
    return { title: preview.title, username: preview.username }
  }
  const entity =
    peer instanceof Api.InputPeerChannel
      ? (await client.invoke(new Api.channels.GetChannels({ id: [new Api.InputChannel({ channelId: peer.channelId, accessHash: peer.accessHash })] }))).chats[0]
      : peer instanceof Api.InputPeerChat
        ? (await client.invoke(new Api.messages.GetChats({ id: [peer.chatId] }))).chats[0]
        : undefined
  if (!(entity instanceof Api.Channel || entity instanceof Api.Chat)) return {}
  const { preview } = await describeGroup(client, entity, true, null)
  return {
    title: preview.title,
    username: preview.username,
    visibility: preview.visibility,
    membersCount: preview.membersCount,
    inviteLink: preview.inviteLink ?? chat.inviteLink,
  }
}
