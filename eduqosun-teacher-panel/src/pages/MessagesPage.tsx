import { useMemo, useState } from 'react'
import { MessagesSquare, PenSquare } from 'lucide-react'
import type { Conversation } from '../types'
import { cn } from '../lib/cn'
import { matchesQuery } from '../lib/text'
import { compareConversations } from '../domain/conversations'
import { useStudentMap } from '../hooks/useData'
import { navigate, useRoute } from '../router'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { selectUnreadMessages } from '../store/selectors'
import { openModal } from '../store/uiStore'
import { ChatView } from '../components/messages/ChatView'
import { ConversationList, type ConversationFilter } from '../components/messages/ConversationList'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

function matchesFilter(conversation: Conversation, filter: ConversationFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'unread') return conversation.unread > 0
  return conversation.kind === filter
}

const filters: ConversationFilter[] = ['all', 'unread', 'student', 'parent', 'group']

export function MessagesPage() {
  const conversations = useApp((s) => s.conversations)
  const unreadTotal = useApp(selectUnreadMessages)
  const studentMap = useStudentMap()
  const { now, today } = useClock()
  const { param } = useRoute()
  const [filter, setFilter] = useState<ConversationFilter>('all')
  const [query, setQuery] = useState('')

  const sorted = useMemo(() => [...conversations].sort(compareConversations), [conversations])

  const counts = useMemo(
    () => Object.fromEntries(filters.map((f) => [f, conversations.filter((c) => matchesFilter(c, f)).length])) as Record<ConversationFilter, number>,
    [conversations],
  )

  const visible = useMemo(
    () =>
      sorted.filter(
        (c) => matchesFilter(c, filter) && matchesQuery(query, c.title, c.subtitle, ...c.messages.slice(-20).map((m) => m.text)),
      ),
    [sorted, filter, query],
  )

  const active = conversations.find((c) => c.id === param) ?? null
  const student = active?.studentId ? studentMap.get(active.studentId) : undefined

  const open = (id: string) => navigate(`messages/${id}`, { replace: param !== null })
  const close = () => navigate('messages', { replace: true })

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Xabarlar"
        description={unreadTotal > 0 ? `${unreadTotal} ta o'qilmagan xabar` : "O'quvchilar, ota-onalar va guruhlar bilan yozishmalar"}
        actions={
          <Button icon={PenSquare} size="lg" onClick={() => openModal({ type: 'compose' })}>
            Yangi xabar
          </Button>
        }
      />

      <Card className="grid h-[calc(100dvh-220px)] min-h-[520px] overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className={cn('min-h-0 border-slate-100 dark:border-slate-700/60 lg:block lg:border-r', active ? 'hidden' : 'block')}>
          <ConversationList
            conversations={visible}
            activeId={active?.id ?? null}
            onOpen={open}
            filter={filter}
            onFilterChange={setFilter}
            counts={counts}
            query={query}
            onQueryChange={setQuery}
            now={now}
          />
        </div>
        <div className={cn('min-h-0', active ? 'block' : 'hidden lg:block')}>
          {active ? (
            <ChatView key={active.id} conversation={active} student={student} today={today} onBack={close} onDeleted={close} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-slate-50/70 p-8 text-center dark:bg-slate-900/40">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <MessagesSquare className="h-8 w-8" aria-hidden="true" />
              </span>
              <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">Suhbatni tanlang</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Chap tomondagi ro'yxatdan suhbatni oching yoki yangi xabar yozing.
              </p>
              <Button className="mt-4" variant="soft" icon={PenSquare} onClick={() => openModal({ type: 'compose' })}>
                Yangi xabar
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
