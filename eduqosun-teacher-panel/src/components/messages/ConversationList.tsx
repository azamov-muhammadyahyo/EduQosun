import { memo } from 'react'
import { MessagesSquare, Pin, Users } from 'lucide-react'
import type { Conversation, ConversationKind } from '../../types'
import { conversationKindLabel } from '../../data/catalog'
import { cn } from '../../lib/cn'
import { formatChatTime } from '../../lib/date'
import { lastMessage } from '../../domain/conversations'
import { Avatar } from '../ui/Avatar'
import { EmptyState } from '../ui/EmptyState'
import { SearchInput } from '../ui/Form'
import { IconBox } from '../ui/IconBox'
import { FilterPills } from '../ui/Tabs'

export type ConversationFilter = ConversationKind | 'all' | 'unread'

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onOpen: (id: string) => void
  filter: ConversationFilter
  onFilterChange: (filter: ConversationFilter) => void
  counts: Record<ConversationFilter, number>
  query: string
  onQueryChange: (query: string) => void
  now: Date
}

export function ConversationAvatar({ conversation, size = 'md' }: { conversation: Conversation; size?: 'sm' | 'md' }) {
  if (conversation.kind === 'group') {
    return <IconBox icon={Users} color={conversation.color} size={size === 'sm' ? 'sm' : 'md'} rounded="full" />
  }
  return <Avatar name={conversation.title} color={conversation.color} size={size} />
}

const Item = memo(function Item({ conversation, active, onOpen, now }: { conversation: Conversation; active: boolean; onOpen: (id: string) => void; now: Date }) {
  const last = lastMessage(conversation)
  const unread = conversation.unread > 0
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(conversation.id)}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors',
          active ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40',
        )}
      >
        <ConversationAvatar conversation={conversation} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className={cn('flex min-w-0 items-center gap-1 truncate text-sm', unread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-100')}>
              {conversation.pinned ? <Pin className="h-3 w-3 shrink-0 rotate-45 text-blue-500" aria-label="Qadalgan" /> : null}
              <span className="truncate">{conversation.title}</span>
            </span>
            <span className={cn('shrink-0 text-[11px]', unread ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-400')}>
              {last ? formatChatTime(last.sentAt, now) : ''}
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span className={cn('min-w-0 flex-1 truncate text-xs', unread ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400')}>
              {last ? `${last.from === 'me' ? 'Siz: ' : last.author ? `${last.author}: ` : ''}${last.text}` : conversation.subtitle}
            </span>
            {unread ? (
              <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {conversation.unread}
              </span>
            ) : (
              <span className="shrink-0 text-[10px] text-slate-400">{conversationKindLabel[conversation.kind]}</span>
            )}
          </span>
        </span>
      </button>
    </li>
  )
})

/** Suhbatlar ro'yxati: qidiruv, turi bo'yicha filtr */
export function ConversationList({ conversations, activeId, onOpen, filter, onFilterChange, counts, query, onQueryChange, now }: ConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-slate-100 p-4 dark:border-slate-700/60">
        <SearchInput size="sm" value={query} onChange={onQueryChange} placeholder="Suhbatlarni qidirish..." aria-label="Suhbat qidirish" />
        <FilterPills<ConversationFilter>
          size="sm"
          label="Suhbat turi"
          value={filter}
          onChange={onFilterChange}
          items={[
            { value: 'all', label: 'Barchasi', count: counts.all },
            { value: 'unread', label: "O'qilmagan", count: counts.unread },
            { value: 'student', label: "O'quvchilar", count: counts.student },
            { value: 'parent', label: 'Ota-onalar', count: counts.parent },
            { value: 'group', label: 'Guruhlar', count: counts.group },
          ]}
        />
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <EmptyState compact icon={MessagesSquare} message="Suhbat topilmadi" />
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conversation) => (
              <Item key={conversation.id} conversation={conversation} active={conversation.id === activeId} onOpen={onOpen} now={now} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
