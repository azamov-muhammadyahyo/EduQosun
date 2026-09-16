import { useRef, useState } from 'react'
import {
  Bell,
  BellOff,
  BellRing,
  CalendarClock,
  CalendarX2,
  CheckCheck,
  ClipboardCheck,
  Mail,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { AccentColor, AppNotification, NotificationKind } from '../../../types'
import { cn } from '../../../lib/cn'
import { formatTimeAgo } from '../../../lib/date'
import { navigate } from '../../../router'
import { useApp } from '../../../store/appStore'
import { useNow } from '../../../store/clock'
import {
  clearNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  removeNotification,
} from '../../../store/actions/feed'
import { selectUnreadNotifications, selectVisibleNotifications } from '../../../store/selectors'
import { EmptyState } from '../../ui/EmptyState'
import { IconBox } from '../../ui/IconBox'
import { IconButton } from '../../ui/IconButton'
import { Popover } from '../../ui/Popover'

const kindConfig: Record<NotificationKind, { icon: LucideIcon; color: AccentColor }> = {
  message: { icon: Mail, color: 'blue' },
  submission: { icon: ClipboardCheck, color: 'green' },
  reminder: { icon: BellRing, color: 'amber' },
  attendance: { icon: CalendarX2, color: 'rose' },
  lesson: { icon: CalendarClock, color: 'violet' },
  system: { icon: Sparkles, color: 'indigo' },
}

type Filter = 'all' | 'unread'

function NotificationRow({ item, now, onOpen }: { item: AppNotification; now: Date; onOpen: (item: AppNotification) => void }) {
  const config = kindConfig[item.kind]
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-3 pr-10 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40',
          !item.read && 'bg-blue-50/50 dark:bg-blue-500/5',
        )}
      >
        <IconBox icon={config.icon} color={config.color} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{item.title}</span>
            {!item.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="O'qilmagan" /> : null}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.text}</span>
          <span className="mt-1 block text-[11px] text-slate-400">{formatTimeAgo(item.createdAt, now)}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => removeNotification(item.id)}
        className="absolute right-3 top-3 rounded-md p-1 text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-slate-700"
        aria-label="Bildirishnomani o'chirish"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </li>
  )
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const anchorRef = useRef<HTMLButtonElement>(null)
  const notifications = useApp(selectVisibleNotifications)
  const unread = useApp(selectUnreadNotifications)
  const now = useNow()

  const visible = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications

  const openItem = (item: AppNotification) => {
    markNotificationRead(item.id)
    if (item.route) {
      setOpen(false)
      navigate(item.route)
    }
  }

  return (
    <>
      <IconButton
        ref={anchorRef}
        icon={Bell}
        label={unread > 0 ? `Bildirishnomalar: ${unread} ta o'qilmagan` : 'Bildirishnomalar'}
        size="md"
        badge={unread > 0 ? unread : undefined}
        active={open}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
      />
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        label="Bildirishnomalar"
        className="w-[calc(100vw-1.5rem)] max-w-[380px]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-700/60">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Bildirishnomalar</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {unread > 0 ? `${unread} ta o'qilmagan` : "Barchasi o'qilgan"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              icon={CheckCheck}
              label="Hammasini o'qilgan deb belgilash"
              size="sm"
              disabled={unread === 0}
              onClick={markAllNotificationsRead}
            />
            <IconButton
              icon={Trash2}
              label="Barchasini tozalash"
              size="sm"
              variant="danger"
              disabled={notifications.length === 0}
              onClick={clearNotifications}
            />
          </div>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {(
            [
              { id: 'all', label: 'Barchasi' },
              { id: 'unread', label: `O'qilmagan${unread ? ` (${unread})` : ''}` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                filter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="scrollbar-thin max-h-[min(460px,65vh)] overflow-y-auto py-2">
          {visible.length > 0 ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {visible.map((item) => (
                <NotificationRow key={item.id} item={item} now={now} onOpen={openItem} />
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={BellOff}
              title={filter === 'unread' ? "Hammasi o'qilgan" : "Bildirishnomalar yo'q"}
              message="Yangi xabar, topshiriq yoki eslatma bo'lsa shu yerda ko'rinadi."
            />
          )}
        </div>
      </Popover>
    </>
  )
}
