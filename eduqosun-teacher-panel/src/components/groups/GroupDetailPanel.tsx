import { useMemo } from 'react'
import {
  ArrowRightLeft,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Clock,
  DoorOpen,
  Info,
  PencilLine,
  QrCode,
  Send,
  UserMinus,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import type { AccentColor, Group } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { WEEKDAYS, addDays, dateKeyOfIso, formatDate, startOfWeek, timeOf, toMinutes } from '../../lib/date'
import { formatScore, percent } from '../../lib/format'
import { rosterBreakdown } from '../../domain/students'
import { useGroupMetrics, useTeacherName } from '../../hooks/useData'
import { navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { closeDrawer, openModal } from '../../store/uiStore'
import { Drawer } from '../ui/Drawer'
import { EmptyState } from '../ui/EmptyState'
import { GroupTile } from '../ui/GroupIcon'

function InfoItem({ icon: Icon, color, label, value }: { icon: LucideIcon; color: AccentColor; label: string; value: string }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accent[color].iconBg, accent[color].iconText)}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </li>
  )
}

interface GroupDetailPanelProps {
  group: Group
  /** Drawer ichida bo'lsa navigatsiyadan oldin panel yopiladi */
  inDrawer?: boolean
}

/** Tanlangan guruh haqida to'liq ma'lumot (Guruhlarim sahifasining o'ng ustuni) */
export function GroupDetailPanel({ group, inDrawer = false }: GroupDetailPanelProps) {
  const students = useApp((s) => s.students)
  const teacherName = useTeacherName()
  const metrics = useGroupMetrics().get(group.id)
  const { today, minutes } = useClock()
  const breakdown = useMemo(() => rosterBreakdown(students, group.id), [students, group.id])
  const completed = group.status === 'completed'
  const mainCount = completed ? breakdown.graduated : breakdown.active

  // Joriy haftadagi darslar holati: o'tilgan / keyingi dars
  const week = useMemo(() => {
    const monday = startOfWeek(today)
    let nextMarked = false
    return group.schedule.map((slot) => {
      const date = addDays(monday, slot.day - 1)
      const passed = date < today || (date === today && toMinutes(slot.end) <= minutes)
      let status: 'done' | 'next' | 'later' = passed ? 'done' : 'later'
      if (!passed && !nextMarked && !completed) {
        status = 'next'
        nextMarked = true
      }
      return { slot, date, status }
    })
  }, [group.schedule, today, minutes, completed])

  const go = (run: () => void) => {
    if (inDrawer) closeDrawer()
    run()
  }

  const quickActions: { label: string; icon: LucideIcon; onClick: () => void }[] = [
    { label: "O'quvchilar", icon: Users, onClick: () => go(() => navigateTo('students', null, { group: group.id })) },
    { label: 'Davomat', icon: CalendarCheck, onClick: () => go(() => navigateTo('attendance', null, { group: group.id })) },
    { label: 'Baholar', icon: ClipboardCheck, onClick: () => go(() => navigateTo('grades', null, { group: group.id })) },
    { label: 'Tahrirlash', icon: PencilLine, onClick: () => openModal({ type: 'group-form', groupId: group.id }) },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-700/60 dark:bg-slate-800">
      {/* To'q ko'k sarlavha */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900 p-5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <GroupTile icon={group.icon} color={group.color} size="xl" muted={completed} className="shadow-lg" />
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold',
              completed ? 'bg-white/15 text-slate-200' : 'bg-emerald-500 text-white',
            )}
          >
            {completed ? 'Tugagan' : 'Faol'}
          </span>
        </div>
        <h2 className="relative mt-4 text-xl font-bold leading-tight">{group.course}</h2>
        <div className="relative mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-blue-500/30 px-2.5 py-1 text-xs font-medium text-blue-100">{group.direction}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">{group.name}</span>
        </div>
        {group.tagline ? <p className="relative mt-3 text-[13px] leading-relaxed text-white/80">{group.tagline}</p> : null}
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-4 gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 px-1 py-2 text-[11px] font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10"
            >
              <action.icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Davomat</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {metrics?.attendanceRate === null || metrics?.attendanceRate === undefined ? '—' : `${Math.round(metrics.attendanceRate)}%`}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">O'rtacha baho</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatScore(metrics?.gradeAverage ?? null)}</p>
          </div>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
          <InfoItem
            icon={CalendarDays}
            color="blue"
            label="Tashkil etilgan sana"
            value={`${formatDate(dateKeyOfIso(group.createdAt))}, ${timeOf(new Date(group.createdAt))}`}
          />
          <InfoItem
            icon={Clock}
            color="blue"
            label={completed ? 'Kurs davri' : 'Ochildi'}
            value={
              completed && group.endDate
                ? `${formatDate(group.startDate)} – ${formatDate(group.endDate)}`
                : `${formatDate(group.startDate)}, ${group.schedule[0]?.start ?? ''}`
            }
          />
          <InfoItem icon={QrCode} color="blue" label="Guruh kodi" value={group.code} />
          <InfoItem icon={DoorOpen} color="sky" label="Xona" value={group.room || '—'} />
          <InfoItem icon={UserRound} color="blue" label="O'qituvchi" value={teacherName} />
          <InfoItem icon={UsersRound} color="slate" label="O'quvchilar soni (jami)" value={String(breakdown.total)} />
          <InfoItem
            icon={CircleCheck}
            color="green"
            label={completed ? 'Bitirganlar' : "O'qiyotganlar"}
            value={`${mainCount} (${percent(mainCount, breakdown.total)}%)`}
          />
          <InfoItem icon={UserMinus} color="rose" label="Chiqqanlar" value={`${breakdown.left} (${percent(breakdown.left, breakdown.total)}%)`} />
          <InfoItem
            icon={ArrowRightLeft}
            color="violet"
            label="Guruhga o'tganlar"
            value={`${breakdown.transferred} (${percent(breakdown.transferred, breakdown.total)}%)`}
          />
        </ul>

        {group.description ? (
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Guruh haqida
            </h3>
            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{group.description}</p>
          </section>
        ) : null}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Darslar jadvali
            </h3>
            <button
              type="button"
              onClick={() => go(() => navigateTo('lessons', null, { view: 'week' }))}
              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Barchasi
            </button>
          </div>
          {week.length > 0 ? (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-700/60 dark:border-slate-700">
              {week.map(({ slot, status }) => (
                <li key={`${slot.day}-${slot.start}`} className="flex items-center gap-3 px-3 py-2.5 text-[13px]">
                  <span className="w-24 shrink-0 font-semibold text-slate-800 dark:text-slate-100">{WEEKDAYS[slot.day - 1]}</span>
                  <span className="flex-1 tabular-nums text-slate-500 dark:text-slate-400">
                    {slot.start} – {slot.end}
                  </span>
                  {completed ? null : status === 'done' ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      O'tilgan
                    </span>
                  ) : status === 'next' ? (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      Keyingi dars
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Rejada</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Jadval kiritilmagan.</p>
          )}
        </section>

        <button
          type="button"
          onClick={() => openModal({ type: 'compose', target: { kind: 'group', id: group.id } })}
          className="flex w-full items-center gap-3 rounded-xl bg-blue-50 p-3.5 text-left transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400">
            <Send className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-blue-700 dark:text-blue-300">Guruhga xabar yuborish</span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">Barcha o'quvchilarga umumiy xabar yuborish</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/** Tor ekranlarda guruh tafsilotlari yon panelda ochiladi */
export function GroupDrawer({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const group = useApp((s) => s.groups.find((g) => g.id === groupId))
  return (
    <Drawer open onClose={onClose} title={group ? `${group.course} — ${group.name}` : 'Guruh'} bodyClassName="p-3 sm:p-4">
      {group ? (
        <GroupDetailPanel group={group} inDrawer />
      ) : (
        <EmptyState icon={Users} title="Guruh topilmadi" message="Bu guruh o'chirilgan bo'lishi mumkin." />
      )}
    </Drawer>
  )
}
