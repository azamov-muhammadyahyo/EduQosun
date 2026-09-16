import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MailOpen,
  MessageSquareDashed,
  Phone,
  Pin,
  PinOff,
  SendHorizontal,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react'
import type { ChatMessage, Conversation, Student } from '../../types'
import { conversationKindLabel, messageTemplates } from '../../data/catalog'
import { cn } from '../../lib/cn'
import { dateKeyOfIso, formatDayHeading, timeOf } from '../../lib/date'
import { phoneHref } from '../../lib/format'
import {
  deleteConversation,
  deleteMessage,
  markConversationRead,
  markConversationUnread,
  sendMessage,
  togglePinned,
} from '../../store/actions/messages'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { confirmAction, openDrawer } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { Menu } from '../ui/Menu'
import { ConversationAvatar } from './ConversationList'

const MAX_LENGTH = 1000

interface ChatViewProps {
  conversation: Conversation
  student: Student | undefined
  today: string
  onBack: () => void
  onDeleted: () => void
}

function Bubble({ message, onDelete, isGroup }: { message: ChatMessage; onDelete: () => void; isGroup: boolean }) {
  const mine = message.from === 'me'
  return (
    <div className={cn('group flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
      {mine ? (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1 text-slate-300 opacity-0 transition-opacity hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600"
          aria-label="Xabarni o'chirish"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[65%]',
          mine
            ? 'rounded-br-md bg-blue-600 text-white'
            : 'rounded-bl-md border border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
        )}
      >
        {!mine && isGroup && message.author ? <p className="mb-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">{message.author}</p> : null}
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        <p className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', mine ? 'text-blue-100' : 'text-slate-400')}>
          {timeOf(new Date(message.sentAt))}
          {mine ? (
            message.read ? (
              <CheckCheck className="h-3.5 w-3.5" aria-label="O'qilgan" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-label="Yuborilgan" />
            )
          ) : null}
        </p>
      </div>
    </div>
  )
}

/** Suhbat oynasi: xabarlar tarixi va yozish maydoni */
export function ChatView({ conversation, student, today, onBack, onDeleted }: ChatViewProps) {
  const [text, setText] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isGroup = conversation.kind === 'group'
  const phone = conversation.kind === 'parent' ? student?.parentPhone : conversation.kind === 'student' ? student?.phone : undefined

  // Suhbat ochilganda o'qilgan deb belgilanadi
  useEffect(() => {
    markConversationRead(conversation.id)
  }, [conversation.id, conversation.unread])

  // Yangi xabar kelganda pastga aylantiriladi
  useLayoutEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [conversation.id, conversation.messages.length])

  useEffect(() => {
    setText('')
    inputRef.current?.focus({ preventScroll: true })
  }, [conversation.id])

  // Yozish maydoni matnga qarab balandlashadi
  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`
  }, [text])

  const send = () => {
    if (!text.trim()) return
    sendMessage(conversation.id, text)
    setText('')
    setShowTemplates(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send()
    }
  }

  const remove = async () => {
    const ok = await confirmAction({
      title: "Suhbatni o'chirish",
      message: `«${conversation.title}» bilan barcha yozishmalar o'chiriladi.`,
      confirmLabel: "O'chirish",
    })
    if (!ok) return
    onDeleted()
    runWithUndo("Suhbat o'chirildi", () => deleteConversation(conversation.id), conversation.title)
  }

  let previousDay = ''

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700/60">
        <IconButton icon={ArrowLeft} label="Suhbatlarga qaytish" className="lg:hidden" onClick={onBack} />
        <ConversationAvatar conversation={conversation} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{conversation.title}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {conversationKindLabel[conversation.kind]} · {conversation.subtitle}
          </p>
        </div>
        {phone ? (
          <IconButton
            icon={Phone}
            label={`Qo'ng'iroq: ${phone}`}
            onClick={() => {
              window.location.href = phoneHref(phone)
            }}
          />
        ) : null}
        {student ? <IconButton icon={UserRound} label="O'quvchi profili" onClick={() => openDrawer({ type: 'student', studentId: student.id })} /> : null}
        <Menu
          label="Suhbat amallari"
          items={[
            {
              id: 'pin',
              label: conversation.pinned ? 'Qadashni bekor qilish' : 'Yuqoriga qadash',
              icon: conversation.pinned ? PinOff : Pin,
              onSelect: () => togglePinned(conversation.id),
            },
            {
              id: 'unread',
              label: "O'qilmagan deb belgilash",
              icon: MailOpen,
              onSelect: () => {
                markConversationUnread(conversation.id)
                onBack()
                notify.info("O'qilmagan deb belgilandi")
              },
            },
            { id: 'delete', label: "Suhbatni o'chirish", icon: Trash2, tone: 'danger', divider: true, onSelect: () => void remove() },
          ]}
        />
      </header>

      <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50/70 px-4 py-4 dark:bg-slate-900/40">
        {conversation.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquareDashed className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden="true" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Hali xabar yo'q. Birinchi xabarni yozing!</p>
          </div>
        ) : (
          conversation.messages.map((message) => {
            const day = dateKeyOfIso(message.sentAt)
            const showDay = day !== previousDay
            previousDay = day
            return (
              <Fragment key={message.id}>
                {showDay ? (
                  <div className="flex justify-center py-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                      {formatDayHeading(day, today)}
                    </span>
                  </div>
                ) : null}
                <Bubble
                  message={message}
                  isGroup={isGroup}
                  onDelete={() => runWithUndo("Xabar o'chirildi", () => deleteMessage(conversation.id, message.id))}
                />
              </Fragment>
            )
          })
        )}
      </div>

      <div className="border-t border-slate-100 p-3 dark:border-slate-700/60">
        {showTemplates ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {messageTemplates.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => {
                  setText(template)
                  setShowTemplates(false)
                  inputRef.current?.focus()
                }}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-500/10"
              >
                {template}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <IconButton icon={Sparkles} label="Tayyor javoblar" size="md" active={showTemplates} onClick={() => setShowTemplates((v) => !v)} />
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            maxLength={MAX_LENGTH}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isGroup ? 'Guruhga xabar yozing...' : 'Xabar yozing...'}
            aria-label="Xabar matni"
            className="scrollbar-thin min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100"
          />
          <Button icon={SendHorizontal} onClick={send} disabled={!text.trim()} aria-label="Yuborish" className="h-10">
            <span className="hidden sm:inline">Yuborish</span>
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-slate-400">
          <b>Enter</b> — yuborish, <b>Shift + Enter</b> — yangi qator
        </p>
      </div>
    </div>
  )
}
