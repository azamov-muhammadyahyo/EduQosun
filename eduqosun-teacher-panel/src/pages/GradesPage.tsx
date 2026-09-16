import { useMemo, useState } from 'react'
import { Award, ClipboardCheck, Download, Hash, Info, Plus, Printer, Star, TrendingDown } from 'lucide-react'
import type { Group } from '../types'
import { addDays, formatNumericDate } from '../lib/date'
import { downloadCsv } from '../lib/download'
import { average, formatScore } from '../lib/format'
import { matchesQuery, slugify } from '../lib/text'
import { formatGrade, gradeColumns, gradeFor, type GradeInputs, type GradeSource } from '../domain/grades'
import { compareStudents, fullName } from '../domain/students'
import { updateQuery, useRoute } from '../router'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { notify } from '../store/toastStore'
import { openModal } from '../store/uiStore'
import { GradebookTable, type GradebookRow } from '../components/grades/GradebookTable'
import { GradesInsights } from '../components/grades/GradesInsights'
import { GroupSwitcher } from '../components/shared/GroupSwitcher'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Checkbox, SearchInput } from '../components/ui/Form'
import { MetricCard } from '../components/ui/MetricCard'
import { PageHeader } from '../components/ui/PageHeader'
import { FilterPills, SegmentedControl } from '../components/ui/Tabs'

type Period = 'month' | 'term' | 'all'
type SourceFilter = GradeSource | 'all'

const periodDays: Record<Period, number | null> = { month: 30, term: 90, all: null }

/** Faol guruhlar oldin, keyin tugaganlar */
function sortGroups(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name, 'uz') : a.status === 'active' ? -1 : 1))
}

export function GradesPage() {
  const groups = useApp((s) => s.groups)
  const students = useApp((s) => s.students)
  const assessments = useApp((s) => s.assessments)
  const grades = useApp((s) => s.grades)
  const assignments = useApp((s) => s.assignments)
  const submissions = useApp((s) => s.submissions)
  const tests = useApp((s) => s.tests)
  const { today } = useClock()
  const { query: params } = useRoute()

  const orderedGroups = useMemo(() => sortGroups(groups), [groups])
  const requested = params.get('group')
  const group = orderedGroups.find((g) => g.id === requested) ?? orderedGroups[0]

  const [period, setPeriod] = useState<Period>('month')
  const [source, setSource] = useState<SourceFilter>('all')
  const [query, setQuery] = useState('')
  const [showFormer, setShowFormer] = useState(false)

  const inputs: GradeInputs = useMemo(
    () => ({ assessments, grades, assignments, submissions, tests }),
    [assessments, grades, assignments, submissions, tests],
  )

  const allColumns = useMemo(() => (group ? gradeColumns(group.id, inputs) : []), [group, inputs])

  const columns = useMemo(() => {
    const days = periodDays[period]
    const from = days === null ? '' : addDays(today, -days)
    return allColumns.filter((c) => c.date >= from && (source === 'all' || c.source === source))
  }, [allColumns, period, source, today])

  const sourceCounts = useMemo(() => {
    const days = periodDays[period]
    const from = days === null ? '' : addDays(today, -days)
    const inPeriod = allColumns.filter((c) => c.date >= from)
    return {
      all: inPeriod.length,
      assessment: inPeriod.filter((c) => c.source === 'assessment').length,
      assignment: inPeriod.filter((c) => c.source === 'assignment').length,
      test: inPeriod.filter((c) => c.source === 'test').length,
    }
  }, [allColumns, period, today])

  const rows: GradebookRow[] = useMemo(() => {
    if (!group) return []
    return students
      .filter((s) => s.groupId === group.id)
      .filter((s) => showFormer || s.status === 'active' || s.status === 'graduated')
      .filter((s) => matchesQuery(query, s.firstName, s.lastName))
      .sort(compareStudents)
      .map((student) => {
        const values = columns.map((column) => gradeFor(column, student.id, inputs))
        return { student, values, average: average(values.filter((v): v is number => v !== null)) }
      })
  }, [group, students, showFormer, query, columns, inputs])

  const columnAverages = useMemo(
    () => columns.map((_, index) => average(rows.map((r) => r.values[index]).filter((v): v is number => v !== null))),
    [columns, rows],
  )

  const summary = useMemo(() => {
    const averages = rows.map((r) => r.average).filter((v): v is number => v !== null)
    return {
      average: average(averages),
      excellent: averages.filter((v) => v >= 9).length,
      weak: averages.filter((v) => v < 6).length,
      marks: rows.reduce((sum, r) => sum + r.values.filter((v) => v !== null).length, 0),
    }
  }, [rows])

  if (!group) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Baholashlar" description="O'quvchilar baholari jurnali" />
        <Card className="p-6">
          <EmptyState icon={ClipboardCheck} title="Guruh yo'q" message="Baholar jurnalini yuritish uchun avval guruh yarating." />
        </Card>
      </div>
    )
  }

  const exportCsv = () => {
    downloadCsv(`baholar-${slugify(group.name)}-${today}`, [
      ["O'quvchi", ...columns.map((c) => `${c.title} (${formatNumericDate(c.date)})`), "O'rtacha"],
      ...rows.map((row) => [fullName(row.student), ...row.values.map((v) => formatGrade(v)), formatGrade(row.average)]),
    ])
    notify.success('Jurnal yuklab olindi', `${group.name} guruhi baholari CSV faylga saqlandi.`)
  }

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Baholashlar"
        description="Baholar jurnali: faollik, so'rov, nazorat ishlari, topshiriq va testlar bir joyda"
        actions={
          <>
            <Button variant="secondary" icon={Printer} onClick={() => window.print()} className="hidden md:inline-flex">
              Chop etish
            </Button>
            <Button variant="secondary" icon={Download} onClick={exportCsv} disabled={rows.length === 0}>
              CSV
            </Button>
            <Button icon={Plus} size="lg" onClick={() => openModal({ type: 'assessment-form', groupId: group.id })}>
              Baholash qo'shish
            </Button>
          </>
        }
      />

      <GroupSwitcher className="print-hidden" groups={orderedGroups} value={group.id} onChange={(id) => updateQuery({ group: id })} />

      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
        <MetricCard label="Guruh o'rtachasi" value={formatScore(summary.average)} icon={Star} color="blue" hint="Tanlangan davr bo'yicha" progress={(summary.average ?? 0) * 10} />
        <MetricCard label="A'lochilar" value={summary.excellent} icon={Award} color="green" hint="O'rtacha baho 9 va undan yuqori" />
        <MetricCard label="Yordam kerak" value={summary.weak} icon={TrendingDown} color="rose" hint="O'rtacha baho 6 dan past" />
        <MetricCard label="Qo'yilgan baholar" value={summary.marks} icon={Hash} color="violet" hint={`${columns.length} ta ustun`} />
      </div>

      <Card className="p-4 sm:p-5">
        <div className="print-hidden mb-4 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <FilterPills<SourceFilter>
            size="sm"
            label="Baho turi"
            value={source}
            onChange={setSource}
            items={[
              { value: 'all', label: 'Barchasi', count: sourceCounts.all },
              { value: 'assessment', label: 'Baholashlar', count: sourceCounts.assessment },
              { value: 'assignment', label: 'Topshiriqlar', count: sourceCounts.assignment },
              { value: 'test', label: 'Testlar', count: sourceCounts.test },
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput size="sm" value={query} onChange={setQuery} placeholder="O'quvchini qidirish..." className="sm:w-56" aria-label="O'quvchi qidirish" />
            <SegmentedControl<Period>
              size="sm"
              label="Davr"
              value={period}
              onChange={setPeriod}
              items={[
                { value: 'month', label: '30 kun' },
                { value: 'term', label: '3 oy' },
                { value: 'all', label: 'Hammasi' },
              ]}
            />
            <Checkbox checked={showFormer} onChange={setShowFormer} label="Chiqqanlar" className="whitespace-nowrap px-1" />
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="O'quvchi topilmadi" message="Bu guruhda (yoki qidiruv bo'yicha) o'quvchi yo'q." />
        ) : columns.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Bu davrda baho yo'q"
            message="Jurnalga yangi ustun qo'shing yoki davrni kengaytiring."
            action={
              <Button icon={Plus} onClick={() => openModal({ type: 'assessment-form', groupId: group.id })}>
                Baholash qo'shish
              </Button>
            }
          />
        ) : (
          <GradebookTable columns={columns} rows={rows} inputs={inputs} columnAverages={columnAverages} />
        )}

        <p className="print-hidden mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
          <span>
            Katakni bosib bahoni (0–10) yozing va <b>Enter</b> bosing — avtomatik saqlanadi. Strelkalar bilan kataklar orasida yuring. Topshiriq
            baholari javob balliga aylantiriladi, test natijalari avtomatik hisoblanadi.
          </span>
        </p>
      </Card>

      <div className="print-hidden">
        <GradesInsights rows={rows} />
      </div>
    </div>
  )
}
