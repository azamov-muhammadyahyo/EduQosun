import { memo } from 'react'
import { AlarmClock, CalendarClock, CalendarPlus, PencilLine, Trash2, Users } from 'lucide-react'
import type { AccentColor, Group, Reminder, ReminderCategory, ReminderPriority } from '../../types'
import { reminderCategoryLabel, reminderPriorityLabel } from '../../data/catalog'
import { cn } from '../../lib/cn'
import { formatRelativeDay } from '../../lib/date'
import { deleteReminder, snoozeReminder, toggleReminder } from '../../store/actions/reminders'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { openModal } from '../../store/uiStore'
import { Badge } from '../ui/Badge'
import { IconButton } from '../ui/IconButton'
import { Menu } from '../ui/Menu'

export const priorityColor: Record<ReminderPriority, AccentColor> = { high: 'rose', medium: 'amber', low: 'slate' }
export const categoryColor: Record<ReminderCategory, AccentColor> = { lesson: 'blue', group: 'violet', meeting: 'teal', personal: 'pink' }

const priorityBar: Record<ReminderPriority, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300 dark:bg-slate-600',
}

interface ReminderItemProps {
  reminder: Reminder
  group: Group | undefined
  today: string
  nowTime: string
}

/** Eslatma qatori: bajarildi belgisi, muddat, muhimlik va tezkor amallar */
export const ReminderItem = memo(function ReminderItem({ reminder, group, today, nowTime }: ReminderItemProps) {
  const overdue = !reminder.done && (reminder.date < today || (reminder.date === today && !!reminder.time && reminder.time < nowTime))
  const toggle = () => {
    toggleReminder(reminder.id)
    if (!reminder.done) notify.success('Bajarildi', reminder.title)
  }

  return (
    <li
      className={cn(
        'group relative flex items-start gap-3 overflow-hidden rounded-xl border bg-white py-3 pl-4 pr-2 transition-colors dark:bg-slate-800',
        overdue ? 'border-rose-200 dark:border-rose-500/30' : 'border-slate-200/80 dark:border-slate-700/60',
        reminder.done && 'bg-slate-50/80 dark:bg-slate-800/50',
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', reminder.done ? 'bg-emerald-400' : priorityBar[reminder.priority])} aria-hidden="true" />
      <input
        type="checkbox"
        checked={reminder.done}
        onChange={toggle}
        aria-label={reminder.done ? 'Bajarilmagan deb belgilash' : 'Bajarildi deb belgilash'}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-full accent-emerald-600"
      />
      <button type="button" onClick={() => openModal({ type: 'reminder-form', reminderId: reminder.id })} className="min-w-0 flex-1 text-left">
        <p className={cn('text-sm font-semibold', reminder.done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white')}>{reminder.title}</p>
        {reminder.note ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{reminder.note}</p> : null}
        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge size="xs" color={overdue ? 'rose' : reminder.date === today && !reminder.done ? 'blue' : 'slate'} icon={CalendarClock}>
            {formatRelativeDay(reminder.date, today)}
            {reminder.time ? `, ${reminder.time}` : ''}
          </Badge>
          {!reminder.done ? (
            <Badge size="xs" color={priorityColor[reminder.priority]} dot>
              {reminderPriorityLabel[reminder.priority]}
            </Badge>
          ) : null}
          <Badge size="xs" color={categoryColor[reminder.category]}>
            {reminderCategoryLabel[reminder.category]}
          </Badge>
          {group ? (
            <Badge size="xs" icon={Users}>
              {group.name}
            </Badge>
          ) : null}
        </span>
      </button>
      <div className="flex shrink-0 items-center opacity-100 transition-opacity lg:opacity-0 lg:focus-within:opacity-100 lg:group-hover:opacity-100">
        {!reminder.done ? (
          <IconButton
            icon={AlarmClock}
            label="Ertaga eslatish"
            onClick={() => {
              snoozeReminder(reminder.id, 1)
              notify.info('Ertaga eslatiladi', reminder.title)
            }}
          />
        ) : null}
        <Menu
          label={`${reminder.title} — amallar`}
          items={[
            { id: 'edit', label: 'Tahrirlash', icon: PencilLine, onSelect: () => openModal({ type: 'reminder-form', reminderId: reminder.id }) },
            {
              id: 'week',
              label: 'Bir haftaga surish',
              icon: CalendarPlus,
              disabled: reminder.done,
              onSelect: () => {
                snoozeReminder(reminder.id, 7)
                notify.info('Bir haftaga surildi', reminder.title)
              },
            },
            {
              id: 'delete',
              label: "O'chirish",
              icon: Trash2,
              tone: 'danger',
              divider: true,
              onSelect: () => runWithUndo("Eslatma o'chirildi", () => deleteReminder(reminder.id), reminder.title),
            },
          ]}
        />
      </div>
    </li>
  )
})
