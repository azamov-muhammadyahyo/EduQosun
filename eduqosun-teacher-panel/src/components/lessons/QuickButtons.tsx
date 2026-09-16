import { CalendarPlus, ChevronRight, ClipboardPen, ShieldCheck, UserPlus, UsersRound, type LucideIcon } from 'lucide-react'
import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { navigateTo } from '../../router'
import { openModal } from '../../store/uiStore'
import { Card } from '../ui/Card'
import { PanelHeader } from '../ui/PanelHeader'

interface QuickButton {
  id: string
  label: string
  icon: LucideIcon
  color: AccentColor
  onClick: () => void
}

const buttons: QuickButton[] = [
  { id: 'group', label: "Guruh qo'shish", icon: UsersRound, color: 'blue', onClick: () => openModal({ type: 'group-form' }) },
  { id: 'student', label: "O'quvchi qo'shish", icon: UserPlus, color: 'green', onClick: () => openModal({ type: 'student-form' }) },
  { id: 'lesson', label: 'Dars jadvalini tuzish', icon: CalendarPlus, color: 'violet', onClick: () => openModal({ type: 'lesson-form' }) },
  { id: 'tasks', label: 'Topshiriqlar', icon: ClipboardPen, color: 'pink', onClick: () => navigateTo('tasks') },
]

/** "Tezkor amallar" — 2x2 rangli amal plitkalari */
export function QuickButtons() {
  return (
    <Card className="p-5">
      <PanelHeader title="Tezkor amallar" icon={ShieldCheck} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {buttons.map((button) => {
          const Icon = button.icon
          const c = accent[button.color]
          return (
            <button
              key={button.id}
              type="button"
              onClick={button.onClick}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md xl:flex-col xl:items-start 2xl:flex-row 2xl:items-center',
                c.softBorder,
                c.softBg,
              )}
            >
              <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', c.strongBg, c.iconText)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-xs font-medium leading-tight text-slate-700 dark:text-slate-200">{button.label}</span>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 2xl:block" aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </Card>
  )
}
