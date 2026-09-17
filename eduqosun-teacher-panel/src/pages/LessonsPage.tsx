import { useMemo } from 'react'
import { CalendarCheck, CalendarDays, CalendarRange, Clock, List, Plus, Printer, UsersRound } from 'lucide-react'
import type { DateKey } from '../types'
import {
  addDays,
  endOfMonth,
  formatDateWithWeekday,
  formatDuration,
  formatMonthYear,
  formatWeekRange,
  isDateKey,
  startOfMonth,
  startOfWeek,
  toMinutes,
} from '../lib/date'
import { lessonDuration, lessonPhase } from '../domain/lessons'
import { currentRoster } from '../domain/students'
import { useActiveGroups, useGroupMap, useLessonsInRange, useStudents } from '../hooks/useData'
import { updateQuery, useRoute } from '../router'
import { useClock } from '../store/clock'
import { openModal } from '../store/uiStore'
import { DateNavigator, type LessonsView } from '../components/lessons/DateNavigator'
import { DayView } from '../components/lessons/DayView'
import { InspirationCard } from '../components/lessons/InspirationCard'
import { LessonsDonut } from '../components/lessons/LessonsDonut'
import { LessonStats, type LessonStat } from '../components/lessons/LessonStats'
import { LessonsTable } from '../components/lessons/LessonsTable'
import { MonthView } from '../components/lessons/MonthView'
import { QuickButtons } from '../components/lessons/QuickButtons'
import { TodayLessonsWidget } from '../components/lessons/TodayLessonsWidget'
import { WeekView } from '../components/lessons/WeekView'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { PanelHeader } from '../components/ui/PanelHeader'
import { SegmentedControl } from '../components/ui/Tabs'
import { useStickyRail } from '../hooks/useDom'

const views: LessonsView[] = ['day', 'week', 'month', 'list']

/** Darslarim: kunlik / haftalik / oylik jadval va darslar ro'yxati */
export function LessonsPage() {
  const railRef = useStickyRail()
  const { today, minutes } = useClock()
  const { query } = useRoute()
  const rawDate = query.get('date') ?? ''
  const date: DateKey = isDateKey(rawDate) ? rawDate : today
  const rawView = query.get('view') as LessonsView | null
  const view: LessonsView = rawView && views.includes(rawView) ? rawView : 'day'

  const groupMap = useGroupMap()
  const activeGroups = useActiveGroups()
  const students = useStudents()

  // Hafta yoki oy (qaysi biri kengroq bo'lsa) darslari bir marta hisoblanadi
  const weekStart = startOfWeek(date)
  const weekEnd = addDays(weekStart, 6)
  const rangeFrom = view === 'month' ? (startOfMonth(date) < weekStart ? startOfMonth(date) : weekStart) : weekStart
  const rangeTo = view === 'month' ? (endOfMonth(date) > weekEnd ? endOfMonth(date) : weekEnd) : weekEnd
  const lessons = useLessonsInRange(rangeFrom, rangeTo)

  const dayLessons = useMemo(() => lessons.filter((l) => l.date === date), [lessons, date])
  const weekLessons = useMemo(() => lessons.filter((l) => l.date >= weekStart && l.date <= weekEnd), [lessons, weekStart, weekEnd])

  const rosterSizes = useMemo(() => {
    const map = new Map<string, number>()
    for (const group of groupMap.values()) map.set(group.id, currentRoster(students, group).length)
    return map
  }, [groupMap, students])

  const weekCounts = useMemo(() => {
    const counts: Record<DateKey, number> = {}
    for (const lesson of weekLessons) if (!lesson.canceled) counts[lesson.date] = (counts[lesson.date] ?? 0) + 1
    return counts
  }, [weekLessons])

  const plan = useMemo(() => {
    const result = { held: 0, remaining: 0, canceled: 0 }
    for (const lesson of weekLessons) {
      const phase = lessonPhase(lesson, today, minutes)
      if (phase === 'held') result.held += 1
      else if (phase === 'canceled') result.canceled += 1
      else result.remaining += 1
    }
    return result
  }, [weekLessons, today, minutes])

  const stats = useMemo<LessonStat[]>(() => {
    const active = dayLessons.filter((l) => !l.canceled)
    const phases = active.map((l) => lessonPhase(l, today, minutes))
    const held = phases.filter((p) => p === 'held').length
    const remaining = active.filter((_, i) => phases[i] !== 'held')
    // Qolgan o'quv vaqti: hozirgi darsning qolgan qismi + keyingi darslar
    const remainingMinutes = remaining.reduce(
      (sum, lesson) =>
        sum + (date === today && lessonPhase(lesson, today, minutes) === 'live' ? toMinutes(lesson.end) - minutes : lessonDuration(lesson)),
      0,
    )
    const weekActive = weekLessons.filter((l) => !l.canceled).length
    const isToday = date === today
    return [
      {
        id: 'week',
        label: 'Jami darslar',
        value: weekActive,
        icon: UsersRound,
        color: 'blue',
        hint: 'Shu haftada',
        hintTone: 'accent',
        onClick: () => updateQuery({ view: 'week' }),
      },
      {
        id: 'groups',
        label: 'Jami guruhlar',
        value: activeGroups.length,
        icon: UsersRound,
        color: 'green',
        hint: `${students.filter((s) => s.status === 'active').length} ta o'quvchi`,
        hintTone: 'up',
      },
      {
        id: 'day',
        label: isToday ? 'Bugungi darslar' : 'Kun darslari',
        value: active.length,
        icon: CalendarCheck,
        color: 'violet',
        hint: `${held} ta o'tkazildi`,
        hintTone: 'accent',
        onClick: () => updateQuery({ view: 'day' }),
      },
      {
        id: 'remaining',
        label: 'Qolgan darslar',
        value: remaining.length,
        icon: Clock,
        color: 'amber',
        hint: remaining.length > 0 ? formatDuration(remainingMinutes) : 'Yakunlandi',
        hintTone: 'accent',
      },
    ]
  }, [dayLessons, weekLessons, date, today, minutes, activeGroups, students, plan.held])

  const setDate = (value: DateKey) => updateQuery({ date: value === today ? null : value })
  const setView = (value: LessonsView) => updateQuery({ view: value === 'day' ? null : value })
  const openDay = (value: DateKey) => updateQuery({ view: null, date: value === today ? null : value })

  const heading = {
    day: { title: date === today ? 'Bugungi darslar' : 'Kun darslari', subtitle: formatDateWithWeekday(date) },
    week: { title: 'Haftalik jadval', subtitle: formatWeekRange(date) },
    month: { title: 'Oylik jadval', subtitle: formatMonthYear(date) },
    list: { title: "Darslar ro'yxati", subtitle: "Barcha darslaringizni ko'rish va boshqarish" },
  }[view]

  return (
    <div className="animate-fade-in grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <PageHeader
            title="Darslarim"
            description="Bugungi va kelgusi darslaringizni shu yerda ko'rishingiz mumkin"
            icon={CalendarDays}
          />
          <div className="flex flex-wrap items-center gap-2">
            <DateNavigator date={date} view={view} onChange={setDate} />
            <Button icon={Plus} size="lg" onClick={() => openModal({ type: 'lesson-form', date: date < today ? today : date })}>
              Yangi dars
            </Button>
          </div>
        </div>

        <LessonStats items={stats} />

        <Card className="p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PanelHeader title={heading.title} subtitle={heading.subtitle} icon={view === 'list' ? List : view === 'day' ? CalendarDays : CalendarRange} />
            <div className="flex items-center gap-2">
              {view !== 'list' ? (
                <Button variant="ghost" size="sm" icon={Printer} onClick={() => window.print()} className="print-hidden hidden md:inline-flex">
                  Chop etish
                </Button>
              ) : null}
              <SegmentedControl<LessonsView>
                label="Ko'rinish"
                value={view}
                onChange={setView}
                items={[
                  { value: 'day', label: date === today ? 'Bugun' : 'Kun' },
                  { value: 'week', label: 'Hafta' },
                  { value: 'month', label: 'Oy' },
                  { value: 'list', label: "Ro'yxat" },
                ]}
              />
            </div>
          </div>

          {view === 'day' ? (
            <DayView date={date} lessons={dayLessons} groupMap={groupMap} rosterSize={(id) => rosterSizes.get(id) ?? 0} />
          ) : view === 'week' ? (
            <WeekView date={date} lessons={weekLessons} groupMap={groupMap} onOpenDay={openDay} />
          ) : view === 'month' ? (
            <MonthView date={date} lessons={lessons} groupMap={groupMap} onOpenDay={openDay} />
          ) : (
            <LessonsTable initialGroup={query.get('group') ?? 'all'} />
          )}
        </Card>
      </div>

      <div ref={railRef} className="print-hidden grid content-start gap-6 md:grid-cols-2 xl:sticky-rail xl:grid-cols-1">
        <TodayLessonsWidget date={date} onSelect={setDate} lessons={dayLessons} groupMap={groupMap} weekCounts={weekCounts} />
        <LessonsDonut plan={plan} label={weekStart <= today && today <= weekEnd ? 'Bu haftada' : formatWeekRange(date)} />
        <QuickButtons />
        <InspirationCard />
      </div>
    </div>
  )
}
