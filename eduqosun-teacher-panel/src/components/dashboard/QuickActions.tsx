import { CalendarPlus, ChevronRight, ClipboardPen, FileQuestion, Send, Settings2, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AccentColor, ModalState } from '../../types'
import { openModal } from '../../store/uiStore'
import { IconBox } from '../ui/IconBox'
import { SectionCard } from '../ui/SectionCard'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: AccentColor
  modal: ModalState
}

const actions: QuickAction[] = [
  {
    id: 'group',
    title: 'Yangi guruh yaratish',
    description: "Guruh ochish va o'quvchilar qo'shish",
    icon: UsersRound,
    color: 'blue',
    modal: { type: 'group-form' },
  },
  {
    id: 'lesson',
    title: 'Dars jadvalini tuzish',
    description: 'Dars vaqti va mavzusini belgilash',
    icon: CalendarPlus,
    color: 'green',
    modal: { type: 'lesson-form' },
  },
  {
    id: 'assignment',
    title: 'Topshiriq berish',
    description: "O'quvchilarga vazifa yuklash",
    icon: ClipboardPen,
    color: 'amber',
    modal: { type: 'assignment-form' },
  },
  {
    id: 'test',
    title: 'Test yaratish',
    description: 'Onlayn test tayyorlash',
    icon: FileQuestion,
    color: 'violet',
    modal: { type: 'test-builder' },
  },
  {
    id: 'message',
    title: 'Xabar yuborish',
    description: "Guruh yoki o'quvchilarga xabar",
    icon: Send,
    color: 'sky',
    modal: { type: 'compose' },
  },
]

/** Tezkor amallar — har biri tegishli oynani ochadi */
export function QuickActions() {
  return (
    <SectionCard title="Tezkor amallar" icon={Settings2} className="h-full" bodyClassName="p-3">
      <ul className="space-y-1">
        {actions.map((action) => (
          <li key={action.id}>
            <button
              type="button"
              onClick={() => openModal(action.modal)}
              className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              <IconBox icon={action.icon} color={action.color} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{action.title}</span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{action.description}</span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400 dark:text-slate-600"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
