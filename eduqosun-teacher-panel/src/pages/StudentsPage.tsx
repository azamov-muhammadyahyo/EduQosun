import { useCallback, useMemo, useState } from 'react'
import {
  CalendarCheck,
  Download,
  GraduationCap,
  LayoutGrid,
  List,
  Send,
  Star,
  TriangleAlert,
  UserPlus,
  UserRoundSearch,
  X,
} from 'lucide-react'
import type { StudentStatus } from '../types'
import { studentStatusLabel } from '../data/catalog'
import { formatNumericDate } from '../lib/date'
import { downloadCsv } from '../lib/download'
import { average, formatScore } from '../lib/format'
import { matchesQuery } from '../lib/text'
import { compareStudents } from '../domain/students'
import { useGroupMap, useStudentMetrics, useStudents } from '../hooks/useData'
import { useGroupOptions } from '../hooks/useOptions'
import { updateQuery, useRoute } from '../router'
import { notify } from '../store/toastStore'
import { openModal } from '../store/uiStore'
import { BulkMessageModal } from '../components/students/BulkMessageModal'
import { StudentCard } from '../components/students/StudentCard'
import { StudentsInsights } from '../components/students/StudentsInsights'
import { StudentsTable, type StudentRow } from '../components/students/StudentsTable'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Checkbox, SearchInput, Select } from '../components/ui/Form'
import { MetricCard } from '../components/ui/MetricCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination, paginate } from '../components/ui/Pagination'
import { FilterPills, SegmentedControl } from '../components/ui/Tabs'
import { useStickyRail } from '../hooks/useDom'

type StatusFilter = StudentStatus | 'all'
type SortKey = 'name' | 'score' | 'attendance' | 'grade' | 'newest'
type Layout = 'table' | 'grid'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'name', label: "Familiya bo'yicha" },
  { value: 'score', label: "Reyting bo'yicha" },
  { value: 'attendance', label: "Davomat bo'yicha" },
  { value: 'grade', label: "Baho bo'yicha" },
  { value: 'newest', label: "Yangi qo'shilganlar" },
]

const statusOrder: StatusFilter[] = ['active', 'all', 'left', 'transferred', 'graduated']
const sortKeys = sortOptions.map((o) => o.value)

export function StudentsPage() {
  const railRef = useStickyRail()
  const students = useStudents()
  const metrics = useStudentMetrics()
  const groupMap = useGroupMap()
  const { query: params } = useRoute()
  const groupOptions = useGroupOptions({ includeCompleted: true, allLabel: 'Barcha guruhlar' })

  // Filtrlar URL'da saqlanadi — havolani ulashish va "orqaga" tugmasi to'g'ri ishlaydi
  const groupId = params.get('group') ?? 'all'
  const status = (statusOrder.includes(params.get('status') as StatusFilter) ? params.get('status') : 'active') as StatusFilter
  const sort = (sortKeys.includes(params.get('sort') as SortKey) ? params.get('sort') : 'name') as SortKey
  const riskOnly = params.get('risk') === '1'

  const [query, setQuery] = useState('')
  const [layout, setLayout] = useState<Layout>('table')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

  const setFilter = (patch: Record<string, string | null>) => {
    updateQuery(patch)
    setPage(1)
  }

  const inGroup = useMemo(() => students.filter((s) => groupId === 'all' || s.groupId === groupId), [students, groupId])

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: inGroup.length, active: 0, left: 0, transferred: 0, graduated: 0 }
    for (const student of inGroup) result[student.status] += 1
    return result
  }, [inGroup])

  const rows: StudentRow[] = useMemo(() => {
    const value = (id: string, key: 'score' | 'attendanceRate' | 'gradeAverage') => metrics.get(id)?.[key] ?? -1
    return inGroup
      .filter((s) => status === 'all' || s.status === status)
      .filter((s) => !riskOnly || metrics.get(s.id)?.atRisk)
      .filter((s) => matchesQuery(query, s.firstName, s.lastName, s.phone, s.parentName, groupMap.get(s.groupId)?.name))
      .sort((a, b) => {
        switch (sort) {
          case 'score':
            return value(b.id, 'score') - value(a.id, 'score')
          case 'attendance':
            return value(b.id, 'attendanceRate') - value(a.id, 'attendanceRate')
          case 'grade':
            return value(b.id, 'gradeAverage') - value(a.id, 'gradeAverage')
          case 'newest':
            return b.joinedAt.localeCompare(a.joinedAt)
          default:
            return compareStudents(a, b)
        }
      })
      .map((student) => ({ student, group: groupMap.get(student.groupId), metrics: metrics.get(student.id) }))
  }, [inGroup, status, riskOnly, query, sort, metrics, groupMap])

  const summary = useMemo(() => {
    const active = inGroup.filter((s) => s.status === 'active')
    const pick = (key: 'attendanceRate' | 'gradeAverage') =>
      active.map((s) => metrics.get(s.id)?.[key]).filter((v): v is number => v !== null && v !== undefined)
    return {
      active: active.length,
      attendance: average(pick('attendanceRate')),
      grade: average(pick('gradeAverage')),
      atRisk: active.filter((s) => metrics.get(s.id)?.atRisk).length,
    }
  }, [inGroup, metrics])

  const pageSize = layout === 'table' ? 12 : 9
  const { slice, pageCount, page: safePage } = paginate(rows, page, pageSize)
  const selectedStudents = useMemo(() => students.filter((s) => selected.has(s.id)), [students, selected])

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const row of slice) {
        if (checked) next.add(row.student.id)
        else next.delete(row.student.id)
      }
      return next
    })
  }

  const exportCsv = (list: StudentRow[]) => {
    downloadCsv(`oquvchilar-${new Date().toISOString().slice(0, 10)}`, [
      ['Familiya', 'Ism', 'Guruh', 'Kurs', 'Telefon', 'Ota-ona', 'Ota-ona telefoni', "Qo'shilgan", 'Holat', 'Davomat %', "O'rtacha baho", 'Topshiriqlar', 'Reyting'],
      ...list.map(({ student, group, metrics: m }) => [
        student.lastName,
        student.firstName,
        group?.name,
        group?.course,
        student.phone,
        student.parentName,
        student.parentPhone,
        formatNumericDate(student.joinedAt),
        studentStatusLabel[student.status],
        m?.attendanceRate == null ? '' : Math.round(m.attendanceRate),
        m?.gradeAverage == null ? '' : formatScore(m.gradeAverage),
        m ? `${m.assignmentsDone}/${m.assignmentsTotal}` : '',
        m?.score == null ? '' : Math.round(m.score),
      ]),
    ])
    notify.success("Ro'yxat yuklab olindi",`${list.length} ta o'quvchi CSV faylga saqlandi.`)
  }

  const resetFilters = () => {
    setQuery('')
    setFilter({ group: null, status: null, risk: null, sort: null })
  }

  return (
    <div className="animate-fade-in grid grid-cols-1 gap-6 min-[1440px]:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <PageHeader
          title="O'quvchilar"
          description="Barcha o'quvchilaringiz, ularning davomati, baholari va rivoji"
          actions={
            <>
              <Button variant="secondary" icon={Download} onClick={() => exportCsv(rows)} disabled={rows.length === 0}>
                Eksport
              </Button>
              <Button icon={UserPlus} size="lg" onClick={() => openModal({ type: 'student-form', groupId: groupId === 'all' ? undefined : groupId })}>
                O'quvchi qo'shish
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
          <MetricCard label="O'qiyotgan o'quvchilar" value={summary.active} icon={GraduationCap} color="blue" hint={`Jami ${counts.all} ta yozuv`} onClick={() => setFilter({ status: null, risk: null })} />
          <MetricCard
            label="O'rtacha davomat"
            value={summary.attendance === null ? '—' : `${Math.round(summary.attendance)}%`}
            icon={CalendarCheck}
            color="green"
            progress={summary.attendance ?? 0}
            onClick={() => setFilter({ sort: 'attendance' })}
          />
          <MetricCard
            label="O'rtacha baho"
            value={formatScore(summary.grade)}
            icon={Star}
            color="amber"
            hint="10 ballik tizimda"
            onClick={() => setFilter({ sort: 'grade' })}
          />
          <MetricCard
            label="E'tibor talab qiladi"
            value={summary.atRisk}
            icon={TriangleAlert}
            color="rose"
            hint="Past davomat yoki baho"
            onClick={() => setFilter({ status: null, risk: '1' })}
          />
        </div>

        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <FilterPills<StatusFilter>
              size="sm"
              label="O'quvchi holati"
              value={status}
              onChange={(value) => setFilter({ status: value === 'active' ? null : value })}
              items={statusOrder.map((value) => ({
                value,
                label: value === 'all' ? 'Barchasi' : studentStatusLabel[value],
                count: counts[value],
              }))}
            />
            <SegmentedControl<Layout>
              size="sm"
              label="Ko'rinish"
              value={layout}
              onChange={(value) => {
                setLayout(value)
                setPage(1)
              }}
              items={[
                { value: 'table', label: 'Jadval', icon: List },
                { value: 'grid', label: 'Kartalar', icon: LayoutGrid },
              ]}
            />
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
            <SearchInput
              size="sm"
              value={query}
              onChange={(value) => {
                setQuery(value)
                setPage(1)
              }}
              placeholder="Ism, telefon yoki ota-ona..."
              aria-label="O'quvchi qidirish"
            />
            <Select size="sm" value={groupId} onChange={(value) => setFilter({ group: value === 'all' ? null : value })} options={groupOptions} aria-label="Guruh" />
            <Select size="sm" value={sort} onChange={(value) => setFilter({ sort: value === 'name' ? null : value })} options={sortOptions} aria-label="Saralash" />
            <Checkbox
              className="whitespace-nowrap px-1 text-sm"
              checked={riskOnly}
              onChange={(checked) => setFilter({ risk: checked ? '1' : null })}
              label="Faqat xavf ostidagilar"
            />
          </div>

          {selected.size > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 dark:border-blue-500/30 dark:bg-blue-500/10">
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">{selected.size} ta tanlandi</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button size="sm" icon={Send} onClick={() => setBulkOpen(true)}>
                  Xabar yuborish
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Download}
                  onClick={() => exportCsv(selectedStudents.map((s) => ({ student: s, group: groupMap.get(s.groupId), metrics: metrics.get(s.id) })))}
                >
                  Eksport
                </Button>
                <Button size="sm" variant="ghost" icon={X} onClick={() => setSelected(new Set())}>
                  Bekor qilish
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            {slice.length === 0 ? (
              <EmptyState
                icon={UserRoundSearch}
                title={students.length === 0 ? "Hali o'quvchi yo'q" : "O'quvchi topilmadi"}
                message={students.length === 0 ? "Birinchi o'quvchingizni qo'shing." : "Filtr yoki qidiruv so'zini o'zgartirib ko'ring."}
                action={
                  students.length === 0 ? (
                    <Button icon={UserPlus} onClick={() => openModal({ type: 'student-form' })}>
                      O'quvchi qo'shish
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={resetFilters}>
                      Filtrlarni tozalash
                    </Button>
                  )
                }
              />
            ) : layout === 'table' ? (
              <StudentsTable rows={slice} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {slice.map((row) => (
                  <StudentCard key={row.student.id} row={row} checked={selected.has(row.student.id)} onToggle={toggle} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/60 sm:flex-row">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {rows.length} ta o'quvchidan {slice.length} tasi ko'rsatilmoqda
            </p>
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
          </div>
        </Card>
      </div>

      <aside ref={railRef} className="min-[1440px]:sticky-rail" aria-label="O'quvchilar tahlili">
        <StudentsInsights students={inGroup} metrics={metrics} onShowAtRisk={() => setFilter({ status: null, risk: '1' })} />
      </aside>

      {bulkOpen ? (
        <BulkMessageModal students={selectedStudents} onClose={() => setBulkOpen(false)} onSent={() => setSelected(new Set())} />
      ) : null}
    </div>
  )
}
