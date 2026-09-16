import { useMemo, type ReactNode } from 'react'
import { Cake, MessageSquare, TriangleAlert, Trophy } from 'lucide-react'
import type { DateKey, Student } from '../../types'
import { addDays, diffDays, formatDayMonth, formatRelativeDay } from '../../lib/date'
import type { StudentMetrics } from '../../domain/analytics'
import { fullName } from '../../domain/students'
import { useGroupMap } from '../../hooks/useData'
import { useClock } from '../../store/clock'
import { openDrawer, openModal } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { IconButton } from '../ui/IconButton'
import { PanelHeader } from '../ui/PanelHeader'

interface StudentsInsightsProps {
  students: Student[]
  metrics: Map<string, StudentMetrics>
  onShowAtRisk: () => void
}

const BIRTHDAY_WINDOW = 30

/** Joriy yildagi (yoki keyingi yildagi) tug'ilgan kun sanasi */
function nextBirthday(birthDate: DateKey, today: DateKey): DateKey {
  const year = Number(today.slice(0, 4))
  const thisYear = `${year}${birthDate.slice(4)}`
  return thisYear >= today ? thisYear : `${year + 1}${birthDate.slice(4)}`
}

function PersonButton({ student, children, aside }: { student: Student; children: ReactNode; aside?: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => openDrawer({ type: 'student', studentId: student.id })}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
      >
        <Avatar name={fullName(student)} color={student.color} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{fullName(student)}</span>
          {children}
        </span>
      </button>
      {aside}
    </li>
  )
}

/** O'ng ustun: e'tibor talab qiladiganlar, reyting yetakchilari va yaqin tug'ilgan kunlar */
export function StudentsInsights({ students, metrics, onShowAtRisk }: StudentsInsightsProps) {
  const { today } = useClock()
  const groupMap = useGroupMap()
  const active = useMemo(() => students.filter((s) => s.status === 'active'), [students])

  const atRisk = useMemo(() => active.filter((s) => metrics.get(s.id)?.atRisk), [active, metrics])
  const leaders = useMemo(
    () =>
      active
        .filter((s) => metrics.get(s.id)?.score != null)
        .sort((a, b) => (metrics.get(b.id)?.score ?? 0) - (metrics.get(a.id)?.score ?? 0))
        .slice(0, 5),
    [active, metrics],
  )
  const birthdays = useMemo(() => {
    const limit = addDays(today, BIRTHDAY_WINDOW)
    return active
      .filter((s) => s.birthDate)
      .map((s) => ({ student: s, date: nextBirthday(s.birthDate, today) }))
      .filter((item) => item.date <= limit)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  }, [active, today])

  return (
    <div className="grid content-start gap-6 md:grid-cols-2 min-[1440px]:grid-cols-1">
      <Card className="p-5">
        <PanelHeader
          title="E'tibor talab qiladi"
          icon={TriangleAlert}
          subtitle="Davomati, bahosi yoki vazifalari past"
          action={
            atRisk.length > 0 ? (
              <button type="button" onClick={onShowAtRisk} className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
                {atRisk.length} ta
              </button>
            ) : null
          }
        />
        {atRisk.length === 0 ? (
          <EmptyState compact icon={Trophy} message="Ajoyib! Hozircha xavf ostidagi o'quvchi yo'q." />
        ) : (
          <ul className="mt-3 space-y-1">
            {atRisk.slice(0, 6).map((student) => (
              <PersonButton
                key={student.id}
                student={student}
                aside={
                  <IconButton
                    icon={MessageSquare}
                    label="Ota-onaga xabar"
                    onClick={() =>
                      openModal({
                        type: 'compose',
                        target: { kind: 'parent', id: student.id },
                        text: `Assalomu alaykum! ${fullName(student)}ning o'qishi bo'yicha suhbatlashib olsak. ${metrics.get(student.id)?.riskReasons.join(', ') ?? ''}.`,
                      })
                    }
                  />
                }
              >
                <span className="block truncate text-xs text-amber-600 dark:text-amber-400">
                  {metrics.get(student.id)?.riskReasons.join(' · ')}
                </span>
              </PersonButton>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <PanelHeader title="Reyting yetakchilari" icon={Trophy} subtitle="Davomat, baho va vazifalar asosida" />
        {leaders.length === 0 ? (
          <EmptyState compact icon={Trophy} message="Reyting uchun ma'lumot yetarli emas" />
        ) : (
          <ol className="mt-3 space-y-1">
            {leaders.map((student, index) => (
              <PersonButton
                key={student.id}
                student={student}
                aside={
                  <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    {Math.round(metrics.get(student.id)?.score ?? 0)}
                  </span>
                }
              >
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                  {index + 1}-o'rin · {groupMap.get(student.groupId)?.name}
                </span>
              </PersonButton>
            ))}
          </ol>
        )}
      </Card>

      <Card className="p-5 md:col-span-2 min-[1440px]:col-span-1">
        <PanelHeader title="Yaqin tug'ilgan kunlar" icon={Cake} subtitle={`Keyingi ${BIRTHDAY_WINDOW} kun`} />
        {birthdays.length === 0 ? (
          <EmptyState compact icon={Cake} message="Yaqin kunlarda tug'ilgan kun yo'q" />
        ) : (
          <ul className="mt-3 space-y-1">
            {birthdays.map(({ student, date }) => {
              const age = Number(date.slice(0, 4)) - Number(student.birthDate.slice(0, 4))
              const soon = diffDays(date, today) <= 1
              return (
                <PersonButton
                  key={student.id}
                  student={student}
                  aside={
                    <IconButton
                      icon={MessageSquare}
                      label="Tabrik yuborish"
                      variant={soon ? 'soft' : 'ghost'}
                      onClick={() =>
                        openModal({
                          type: 'compose',
                          target: { kind: 'student', id: student.id },
                          text: `Hurmatli ${student.firstName}! Tug'ilgan kuningiz muborak bo'lsin! Sizga sog'lik, omad va o'qishingizda katta muvaffaqiyatlar tilayman! 🎉`,
                        })
                      }
                    />
                  }
                >
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeDay(date, today) === formatDayMonth(date) ? formatDayMonth(date) : `${formatRelativeDay(date, today)} · ${formatDayMonth(date)}`} · {age} yosh
                  </span>
                </PersonButton>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
