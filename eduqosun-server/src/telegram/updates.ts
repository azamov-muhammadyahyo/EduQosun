import { Api, type TelegramClient } from 'telegram'
import { NewMessage, Raw, type NewMessageEvent } from 'telegram/events/index.js'
import { findChatsByPeer, listChats, type ChatRecord } from '../db.js'
import { broadcast } from '../events.js'
import type { PeerType } from '../types.js'
import { authorOf, toMessageDTO } from './messages.js'
import { peerOf } from './peers.js'

/*
 * Telegramdan keladigan jonli yangilanishlar → panelga (SSE).
 * Faqat panelga ulangan chatlar bo'yicha hodisalar uzatiladi.
 */

function chatsFor(type: PeerType, id: string): ChatRecord[] {
  return findChatsByPeer(type, id)
}

async function onNewMessage(event: NewMessageEvent): Promise<void> {
  const message = event.message
  if (!(message instanceof Api.Message) || !message.peerId) return
  const chats = chatsFor(...peerOf(message.peerId))
  for (const chat of chats) {
    const author = await authorOf(message, chat)
    broadcast('message:new', { conversationId: chat.conversationId, message: toMessageDTO(message, chat.conversationId, { author }) })
  }
}

async function onEdited(message: Api.TypeMessage): Promise<void> {
  if (!(message instanceof Api.Message) || !message.peerId) return
  for (const chat of chatsFor(...peerOf(message.peerId))) {
    const author = await authorOf(message, chat)
    broadcast('message:edit', { conversationId: chat.conversationId, message: toMessageDTO(message, chat.conversationId, { author }) })
  }
}

function onRawUpdate(update: Api.TypeUpdate): void {
  if (update instanceof Api.UpdateEditMessage || update instanceof Api.UpdateEditChannelMessage) {
    void onEdited(update.message)
    return
  }

  if (update instanceof Api.UpdateDeleteChannelMessages) {
    const ids = chatsFor('channel', update.channelId.toString()).map((c) => c.conversationId)
    if (ids.length) broadcast('message:delete', { conversationIds: ids, ids: update.messages })
    return
  }

  if (update instanceof Api.UpdateDeleteMessages) {
    // Oddiy guruh va shaxsiy chatlarda xabar ID'lari akkaunt bo'yicha yagona — chatni ID'ning o'zi aniqlaydi
    const ids = listChats()
      .filter((c) => c.peerType !== 'channel')
      .map((c) => c.conversationId)
    if (ids.length) broadcast('message:delete', { conversationIds: ids, ids: update.messages })
    return
  }

  if (update instanceof Api.UpdateReadHistoryOutbox) {
    for (const chat of chatsFor(...peerOf(update.peer))) broadcast('message:read', { conversationId: chat.conversationId, maxId: update.maxId })
    return
  }

  if (update instanceof Api.UpdateReadChannelOutbox) {
    for (const chat of chatsFor('channel', update.channelId.toString())) broadcast('message:read', { conversationId: chat.conversationId, maxId: update.maxId })
    return
  }

  if (update instanceof Api.UpdateReadHistoryInbox) {
    for (const chat of chatsFor(...peerOf(update.peer))) broadcast('chat:read', { conversationId: chat.conversationId, unread: update.stillUnreadCount })
    return
  }

  if (update instanceof Api.UpdateReadChannelInbox) {
    for (const chat of chatsFor('channel', update.channelId.toString())) broadcast('chat:read', { conversationId: chat.conversationId, unread: update.stillUnreadCount })
  }
}

export function attachUpdateHandlers(client: TelegramClient): void {
  client.addEventHandler((event: NewMessageEvent) => {
    onNewMessage(event).catch((error) => console.warn('Yangi xabarni qayta ishlashda xato:', error))
  }, new NewMessage({}))
  client.addEventHandler((update: Api.TypeUpdate) => {
    try {
      onRawUpdate(update)
    } catch (error) {
      console.warn('Telegram yangilanishida xato:', error)
    }
  }, new Raw({}))
}
