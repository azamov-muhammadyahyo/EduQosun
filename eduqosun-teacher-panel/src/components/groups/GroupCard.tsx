import { memo } from 'react'
import {
  ArrowRightLeft,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Flag,
  PencilLine,
  RotateCcw,
  Send,
  Trash2,
  UserPlus,
} from 'lucide-react'
import type { Group, Student } from '../../types'
import { cn } from '../../lib/cn'
import { formatNumericDate, dateKeyOfIso } from '../../lib/date'
import { fullName, type RosterBreakdown } from '../../domain/students'
import { Badge } from '../ui/Badge'
import { AvatarStack } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { GroupTile } from '../ui/GroupIcon'
import { Menu, type MenuItem } from '../ui/Menu'

export interface GroupCardActions {
  onOpen: (group: Group) => void
  onEdit: (group: Group) => void
  onToggleStatus: (group: Group) => void
  onDelete: (group: Group) => void
  onMessage: (group: Group) => void
  onAddStudent: (group: Group) => void
  onAttendance: (group: Group) => void
  onGrades: (group: Group) => void
}

interface GroupCardProps extends GroupCardActions {
  group: Group
  breakdown: RosterBreakdown
  members: Student[]
  selected: boolean
}

function StatLine({ dot, value, label }: { dot: string; value: number; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden="true" />
      <span className="w-5 font-semibold tabular-nums text-slate-800 dark:text-slate-100">{value}</span>
      <span className="truncate text-slate-500 dark:text-slate-400">{label}</span>
    </li>
  )
}

/** Guruhlar ro'yxatidagi bitta qator (Guruhlarim dizayni) */
export const GroupCard = memo(function GroupCard({ group, breakdown, members, selected, ...actions }: GroupCardProps) {
  const completed = group.status === 'completed'
  const mainCount = completed ? breakdown.graduated : breakdown.active
  const mainLabel = completed ? 'Bitirgan' : "O'qiyotgan"

  const menuItems: MenuItem[] = [
    { id: 'edit', label: 'Tahrirlash', icon: PencilLine, onSelect: () => actions.onEdit(group) },
    ...(!completed
      ? [
          { id: 'student', label: "O'quvchi qo'shish", icon: UserPlus, onSelect: () => actions.onAddStudent(group) },
          { id: 'attendance', label: 'Davomat olish', icon: CalendarCheck, onSelect: () => actions.onAttendance(group) },
        ]
      : []),
    { id: 'grades', label: 'Baholar jurnali', icon: ClipboardCheck, onSelect: () => actions.onGrades(group) },
    { id: 'message', label: 'Guruhga xabar', icon: Send, onSelect: () => actions.onMessage(group) },
    {
      id: 'status',
      label: completed ? 'Qayta faollashtirish' : 'Kursni yakunlash',
      icon: completed ? RotateCcw : Flag,
      divider: true,
      onSelect: () => actions.onToggleStatus(group),
    },
    { id: 'delete', label: "Guruhni o'chirish", icon: Trash2, tone: 'danger', onSelect: () => actions.onDelete(group) },
  ]

  return (
    <article
      className={cn(
        'group/card flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border bg-white p-4 transition-all dark:bg-slate-800',
        selected
          ? 'border-blue-300 shadow-md shadow-blue-600/10 ring-1 ring-blue-500/30 dark:border-blue-500/50'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-card dark:border-slate-700 dark:hover:border-slate-600',
        completed && 'bg-slate-50/70 dark:bg-slate-800/60',
      )}
    >
      {/* Nomi va sanalar */}
      <button
        type="button"
        onClick={() => actions.onOpen(group)}
        className="flex min-w-[240px] flex-1 items-center gap-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <GroupTile icon={group.icon} color={group.color} size="lg" muted={completed} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn('truncate text-[15px] font-semibold', completed ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white')}>
              {group.course}
            </span>
            <Badge color={completed ? 'slate' : group.color} size="xs" variant="soft">
              {group.name}
            </Badge>
          </span>
          <span className="mt-1 inline-flex rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            {group.direction}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Tashkil etilgan: {formatNumericDate(dateKeyOfIso(group.createdAt))}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {completed && group.endDate ? `Tugagan: ${formatNumericDate(group.endDate)}` : `Ochildi: ${formatNumericDate(group.startDate)}`}
            </span>
          </span>
          {/* Tor ekranlarda statistika shu yerda qisqa ko'rinishda */}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] 2xl:hidden">
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {mainCount} {mainLabel.toLowerCase()}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {breakdown.left} chiqqan
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <ArrowRightLeft className="h-3 w-3 text-violet-500" aria-hidden="true" />
              {breakdown.transferred} o'tgan
            </span>
          </span>
        </span>
      </button>

      {/* Ko'rsatkichlar va amallar */}
      <div className="flex w-full items-center gap-5 sm:w-auto">
        <AvatarStack
          className="hidden min-[1700px]:flex"
          people={members.map((s) => ({ id: s.id, name: fullName(s), color: s.color }))}
          max={4}
          total={members.length}
          size="xs"
        />
        <div className="w-[78px] shrink-0">
          <p className="text-lg font-bold leading-tight text-slate-900 dark:text-white">{breakdown.total}</p>
          <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">Jami o'quvchilar</p>
        </div>
        <ul className="hidden w-[142px] shrink-0 space-y-1 2xl:block">
          <StatLine dot={completed ? 'bg-slate-400' : 'bg-blue-500'} value={mainCount} label={mainLabel} />
          <StatLine dot="bg-rose-500" value={breakdown.left} label="Chiqqan" />
          <StatLine dot="bg-violet-500" value={breakdown.transferred} label="Guruhga o'tgan" />
        </ul>
        <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
          {completed ? (
            <Button variant="secondary" size="sm" className="w-[92px] text-slate-500" onClick={() => actions.onOpen(group)}>
              Tugagan
            </Button>
          ) : (
            <Button variant={selected ? 'primary' : 'outline'} size="sm" className="w-[92px]" onClick={() => actions.onOpen(group)}>
              Batafsil
            </Button>
          )}
          <Menu label={`${group.name} — amallar`} items={menuItems} />
        </div>
      </div>
    </article>
  )
})
