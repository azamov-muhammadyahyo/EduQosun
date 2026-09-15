import { MessageSquare } from 'lucide-react'
import { messages } from '../../data/messages'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'
import { Avatar } from '../ui/Avatar'
import { EmptyState } from '../ui/EmptyState'

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/** Xabarlar (§7.10) */
export function Messages() {
  return (
    <SectionCard title="Xabarlar" icon={MessageSquare} action={<SeeAllLink />} bodyClassName="p-3">
      {messages.length > 0 ? (
        <ul className="space-y-1">
          {messages.map((message) => (
            <li key={message.id}>
              <button
                type="button"
                className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <Avatar initials={initialsFromName(message.name)} color={message.color} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {message.name}
                      {message.meta ? (
                        <span className="font-normal text-slate-400"> ({message.meta})</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{message.time}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                    {message.preview}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message="Hozircha xabar yo'q" icon={MessageSquare} />
      )}
    </SectionCard>
  )
}
