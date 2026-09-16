import { useMemo, useState } from 'react'
import { BookOpenCheck, CalendarCheck, ChartLine, ChartPie, ClipboardCheck, Download, Printer, Star, TrendingUp } from 'lucide-react'
import type { MetricTrend } from '../components/ui/MetricCard'
import { formatDate } from '../lib/date'
import { downloadCsv } from '../lib/download'
import { formatScore, formatSigned, percent } from '../lib/format'
import { attendanceByRanges } from '../domain/analytics'
import { lessonPhase, lessonsInRange } from '../domain/lessons'
import { rosterBreakdown } from '../domain/students'
import {
  averageGrade,
  collectGradeEntries,
  completionRate,
  delta,
  periodBuckets,
  periodRange,
  type StatsPeriod,
} from '../domain/statistics'
import { useGroupMetrics, useLessonSources } from '../hooks/useData'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { notify } from '../store/toastStore'
import { GroupComparison, type GroupStatRow } from '../components/statistics/GroupComparison'
import { TrendChart } from '../components/statistics/TrendChart'
import { WorkloadCard } from '../components/statistics/WorkloadCard'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Donut } from '../components/ui/Donut'
import { MetricCard } from '../components/ui/MetricCard'
import { PageHeader } from '../components/ui/PageHeader'
import { PanelHeader } from '../components/ui/PanelHeader'
import { SegmentedControl } from '../components/ui/Tabs'

const periodLabel: Record<StatsPeriod, string> = { '30': '30 kun', '90': '3 oy', '180': '6 oy' }

function trendOf(value: number | null, suffix: string): MetricTrend | undefined {
  if (value === null) return undefined
  if (value === 0) return { text: "O'zgarishsiz", direction: 'flat' }
  return { text: `${formatSigned(value, suffix)} oldingi davrga`, direction: value > 0 ? 'up' : 'down' }
}

export function StatisticsPage() {
  const groups = useApp((s) => s.groups)
  const students = useApp((s) => s.students)
  const attendance = useApp((s) => s.attendance)
  const extras = useApp((s) => s.extraLessons)
  const assessments = useApp((s) => s.assessments)
  const grades = useApp((s) => s.grades)
  const assignments = useApp((s) => s.assignments)
  const submissions = useApp((s) => s.submissions)
  const tests = useApp((s) => s.tests)
  const sources = useLessonSources()
  const groupMetrics = useGroupMetrics()
  const { now, today, minutes } = useClock()
  const [period, setPeriod] = useState<StatsPeriod>('30')

  const activeGroups = useMemo(() => groups.filter((g) => g.status === 'active'), [groups])

  const entries = useMemo(
    () => collectGradeEntries(groups, students, { assessments, grades, assignments, submissions, tests }),
    [groups, students, assessments, grades, assignments, submissions, tests],
  )

  const range = periodRange(period, today)

  const trend = useMemo(() => {
    const buckets = periodBuckets(period, today)
    const rates = attendanceByRanges(buckets, attendance, extras)
    return buckets.map((bucket, index) => {
      const grade = averageGrade(entries, bucket.from, bucket.to)
      return {
        label: bucket.label,
        attendance: rates[index].rate === null ? null : Math.round(rates[index].rate ?? 0),
        homework: rates[index].homeworkRate === null ? null : Math.round(rates[index].homeworkRate ?? 0),
        grade: grade === null ? null : Math.round(grade * 10) / 10,
      }
    })
  }, [period, today, attendance, extras, entries])

  const kpi = useMemo(() => {
    const [current, previous] = attendanceByRanges(
      [
        { label: 'now', from: range.from, to: range.to },
        { label: 'prev', from: range.prevFrom, to: range.prevTo },
      ],
      attendance,
      extras,
    )
    const gradeNow = averageGrade(entries, range.from, range.to)
    const gradePrev = averageGrade(entries, range.prevFrom, range.prevTo)
    const completionNow = completionRate(assignments, submissions, students, range.from, range.to, now)
    const completionPrev = completionRate(assignments, submissions, students, range.prevFrom, range.prevTo, now)
    const held = (from: string, to: string) =>
      lessonsInRange(from, to, sources).filter((l) => lessonPhase(l, today, minutes) === 'held').length
    const heldNow = held(range.from, range.to)
    const heldPrev = held(range.prevFrom, range.prevTo)
    return {
      attendance: current.rate,
      attendanceDelta: delta(current.rate, previous.rate),
      grade: gradeNow,
      gradeDelta: delta(gradeNow, gradePrev, 1),
      completion: completionNow,
      completionDelta: delta(completionNow, completionPrev),
      held: heldNow,
      heldDelta: heldNow - heldPrev,
    }
  }, [range.from, range.to, range.prevFrom, range.prevTo, attendance, extras, entries, assignments, submissions, students, now, sources, today, minutes])

  const groupRows: GroupStatRow[] = useMemo(
    () =>
      activeGroups.map((group) => {
        const [bucket] = attendanceByRanges([{ label: '', from: range.from, to: range.to }], attendance, extras, new Set([group.id]))
        return {
          group,
          students: rosterBreakdown(students, group.id).active,
          attendance: bucket.rate,
          grade: averageGrade(entries, range.from, range.to, group.id),
          completion: completionRate(assignments, submissions, students, range.from, range.to, now, group.id),
          atRisk: groupMetrics.get(group.id)?.atRiskCount ?? 0,
        }
      }),
    [activeGroups, range.from, range.to, attendance, extras, students, entries, assignments, submissions, now, groupMetrics],
  )

  const breakdown = useMemo(() => rosterBreakdown(students), [students])
  const composition = [
    { id: 'active', label: "O'qiyotgan", value: breakdown.active, dot: 'bg-blue-600', stroke: 'stroke-blue-600' },
    { id: 'graduated', label: 'Bitirgan', value: breakdown.graduated, dot: 'bg-emerald-500', stroke: 'stroke-emerald-500' },
    { id: 'transferred', label: "Guruhga o'tgan", value: breakdown.transferred, dot: 'bg-violet-500', stroke: 'stroke-violet-500' },
    { id: 'left', label: 'Chiqqan', value: breakdown.left, dot: 'bg-rose-500', stroke: 'stroke-rose-500' },
  ]

  const exportReport = () => {
    downloadCsv(`statistika-${range.from}-${range.to}`, [
      ['Hisobot davri', `${formatDate(range.from)} – ${formatDate(range.to)}`],
      ["O'rtacha davomat", kpi.attendance === null ? '' : `${Math.round(kpi.attendance)}%`],
      ["O'rtacha baho", formatScore(kpi.grade)],
      ['Topshiriqlar bajarilishi', kpi.completion === null ? '' : `${Math.round(kpi.completion)}%`],
      ["O'tkazilgan darslar", kpi.held],
      [],
      ['Guruh', 'Kurs', "O'quvchilar", 'Davomat %', "O'rtacha baho", 'Topshiriqlar %', 'Xavf ostida'],
      ...groupRows.map((row) => [
        row.group.name,
        row.group.course,
        row.students,
        row.attendance === null ? '' : Math.round(row.attendance),
        formatScore(row.grade),
        row.completion === null ? '' : Math.round(row.completion),
        row.atRisk,
      ]),
    ])
    notify.success('Hisobot yuklab olindi', `${periodLabel[period]} bo'yicha statistika CSV faylga saqlandi.`)
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Statistika"
        description={`Hisobot davri: ${formatDate(range.from)} – ${formatDate(range.to)}`}
        actions={
          <>
            <SegmentedControl<StatsPeriod>
              label="Davr"
              value={period}
              onChange={setPeriod}
              items={(Object.keys(periodLabel) as StatsPeriod[]).map((value) => ({ value, label: periodLabel[value] }))}
            />
            <Button variant="secondary" icon={Printer} onClick={() => window.print()} className="hidden md:inline-flex">
              Chop etish
            </Button>
            <Button icon={Download} onClick={exportReport}>
              Hisobot
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
        <MetricCard
          label="O'rtacha davomat"
          value={kpi.attendance === null ? '—' : `${Math.round(kpi.attendance)}%`}
          icon={CalendarCheck}
          color="blue"
          trend={trendOf(kpi.attendanceDelta, '%')}
          hint={kpi.attendanceDelta === null ? "Taqqoslash uchun ma'lumot yo'q" : undefined}
        />
        <MetricCard label="O'rtacha baho" value={formatScore(kpi.grade)} icon={Star} color="amber" trend={trendOf(kpi.gradeDelta, '')} />
        <MetricCard
          label="Topshiriqlar bajarilishi"
          value={kpi.completion === null ? '—' : `${Math.round(kpi.completion)}%`}
          icon={ClipboardCheck}
          color="green"
          trend={trendOf(kpi.completionDelta, '%')}
        />
        <MetricCard label="O'tkazilgan darslar" value={kpi.held} icon={BookOpenCheck} color="violet" trend={trendOf(kpi.heldDelta, ' ta')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <PanelHeader title="Davomat va uy vazifasi" icon={TrendingUp} subtitle="Foizda, davr bo'laklari bo'yicha" />
          <TrendChart
            data={trend}
            domain={[0, 100]}
            format={(v) => `${Math.round(v)}%`}
            series={[
              { key: 'attendance', name: 'Davomat', color: '#2563EB', dotClass: 'bg-blue-600' },
              { key: 'homework', name: 'Uy vazifasi', color: '#10B981', dotClass: 'bg-emerald-500' },
            ]}
          />
        </Card>
        <Card className="p-5">
          <PanelHeader title="O'rtacha baho dinamikasi" icon={ChartLine} subtitle="Barcha baholar, 10 ballik tizimda" />
          <TrendChart
            data={trend}
            domain={[0, 10]}
            format={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))}
            series={[{ key: 'grade', name: "O'rtacha baho", color: '#2563EB', dotClass: 'bg-blue-600' }]}
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:items-start">
        <GroupComparison rows={groupRows} />
        <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          <Card className="p-5">
            <PanelHeader title="O'quvchilar tarkibi" icon={ChartPie} subtitle={`Jami ${breakdown.total} ta yozuv`} />
            <div className="mt-4 flex items-center gap-5">
              <Donut size={120} thickness={14} label="O'quvchilar tarkibi" segments={composition.map((c) => ({ id: c.id, value: c.value, strokeClass: c.stroke }))}>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{breakdown.active}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">o'qiyapti</span>
              </Donut>
              <ul className="min-w-0 flex-1 space-y-2">
                {composition.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {item.value} <span className="font-normal text-slate-400">({percent(item.value, breakdown.total)}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          <WorkloadCard groups={groups} />
        </div>
      </div>
    </div>
  )
}
