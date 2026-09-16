import { useMemo } from 'react'
import { MessageSquare, Send, Users } from 'lucide-react'
import { formatChatTime } from '../../lib/date'
import { lastMessageAt } from '../../domain/conversations'
import { navigate, navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { useNow } from '../../store/clock'
import { openModal } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { IconBox } from '../ui/IconBox'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'

/** So'nggi suhbatlar (o'qilmaganlar ajratib ko'rsatiladi) */
export function Messages() {
  const conversations = useApp((s) => s.conversations)
  const now = useNow()

  const latest = useMemo(
    () =>
      conversations
        .filter((c) => c.messages.length > 0)
        .sort((a, b) => lastMessageAt(b).localeCompare(lastMessageAt(a)))
        .slice(0, 5),
    [conversations],
  )

  return (
    <SectionCard
      title="Xabarlar"
      icon={MessageSquare}
      className="h-full"
      action={<SeeAllLink onClick={() => navigateTo('messages')} />}
      bodyClassName="p-3"
    >
      {latest.length > 0 ? (
        <ul className="space-y-1">
          {latest.map((conversation) => {
            const last = conversation.messages[conversation.messages.length - 1]
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => navigate(`messages/${conversation.id}`)}
                  className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  {conversation.kind === 'group' ? (
                    <IconBox icon={Users} color={conversation.color} size="sm" rounded="full" />
                  ) : (
                    <Avatar name={conversation.title} color={conversation.color} size="sm" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {conversation.title}
                        {conversation.subtitle ? <span className="font-normal text-slate-400"> ({conversation.subtitle})</span> : null}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{formatChatTime(last.sentAt, now)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`min-w-0 flex-1 truncate text-xs ${conversation.unread > 0 ? 'font-medium text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        {last.from === 'me' ? 'Siz: ' : last.author ? `${last.author}: ` : ''}
                        {last.text}
                      </span>
                      {conversation.unread > 0 ? (
                        <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                          {conversation.unread}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          icon={MessageSquare}
          message="Hozircha xabar yo'q"
          action={
            <Button size="sm" variant="soft" icon={Send} onClick={() => openModal({ type: 'compose' })}>
              Xabar yozish
            </Button>
          }
        />
      )}
    </SectionCard>
  )
}
