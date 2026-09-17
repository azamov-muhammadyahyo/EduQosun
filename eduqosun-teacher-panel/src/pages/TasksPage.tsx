import { useMemo, useState } from 'react'
import { CalendarX2, ClipboardList, FolderSearch, Inbox, Percent, Plus } from 'lucide-react'
import { percent } from '../lib/format'
import { matchesQuery } from '../lib/text'
import { assignmentProgress, assignmentRoster, isPastDue } from '../domain/assignments'
import { useGroupMap, useStudentMap } from '../hooks/useData'
import { useGroupOptions } from '../hooks/useOptions'
import { updateQuery, useRoute } from '../router'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { openModal } from '../store/uiStore'
import { AssignmentCard, type AssignmentItem } from '../components/tasks/AssignmentCard'
import { ReviewQueue } from '../components/tasks/ReviewQueue'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SearchInput, Select } from '../components/ui/Form'
import { MetricCard } from '../components/ui/MetricCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination, paginate } from '../components/ui/Pagination'
import { FilterPills } from '../components/ui/Tabs'
import { useStickyRail } from '../hooks/useDom'

type StatusFilter = 'all' | 'active' | 'review' | 'overdue' | 'closed'
type SortKey = 'due' | 'newest' | 'pending'

const statuses: StatusFilter[] = ['all', 'active', 'review', 'overdue', 'closed']
const PAGE_SIZE = 8

function matchesStatus(item: AssignmentItem, filter: StatusFilter, now: Date): boolean {
  const { assignment, progress } = item
  switch (filter) {
    case 'active':
      return assignment.status === 'active'
    case 'review':
      return progress.pending > 0
    case 'overdue':
      return assignment.status === 'active' && isPastDue(assignment, now)
    case 'closed':
      return assignment.status === 'closed'
    default:
      return true
  }
}

export function TasksPage() {
  const railRef = useStickyRail()
  const assignments = useApp((s) => s.assignments)
  const submissions = useApp((s) => s.submissions)
  const students = useApp((s) => s.students)
  const studentMap = useStudentMap()
  const groupMap = useGroupMap()
  const groupOptions = useGroupOptions({ includeCompleted: true, allLabel: 'Barcha guruhlar' })
  const { now, today } = useClock()
  const { query: params } = useRoute()

  const status = (statuses.includes(params.get('status') as StatusFilter) ? params.get('status') : 'all') as StatusFilter
  const groupId = params.get('group') ?? 'all'
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('due')
  const [page, setPage] = useState(1)

  const items: AssignmentItem[] = useMemo(
    () =>
      assignments.map((assignment) => {
        const roster = assignmentRoster(assignment, students)
        const record = submissions[assignment.id]
        return {
          assignment,
          group: groupMap.get(assignment.groupId),
          progress: assignmentProgress(assignment, roster, record),
          missingIds: roster.filter((s) => !record?.[s.id]).map((s) => s.id),
        }
      }),
    [assignments, students, submissions, groupMap],
  )

  const inGroup = useMemo(() => items.filter((i) => groupId === 'all' || i.assignment.groupId === groupId), [items, groupId])

  const counts = Object.fromEntries(statuses.map((s) => [s, inGroup.filter((i) => matchesStatus(i, s, now)).length])) as Record<StatusFilter, number>

  const visible = useMemo(() => {
    const list = inGroup
      .filter((i) => matchesStatus(i, status, now))
      .filter((i) => matchesQuery(query, i.assignment.title, i.assignment.description, i.group?.name))
    return list.sort((a, b) => {
      if (sort === 'newest') return b.assignment.createdAt.localeCompare(a.assignment.createdAt)
      if (sort === 'pending') return b.progress.pending - a.progress.pending
      // Faollar oldin, keyin muddat bo'yicha (yaqini tepada)
      if (a.assignment.status !== b.assignment.status) return a.assignment.status === 'active' ? -1 : 1
      return a.assignment.dueDate.localeCompare(b.assignment.dueDate)
    })
  }, [inGroup, status, query, sort, now])

  const { slice, pageCount, page: safePage } = paginate(visible, page, PAGE_SIZE)

  const totals = useMemo(() => {
    const active = inGroup.filter((i) => i.assignment.status === 'active')
    const due = inGroup.filter((i) => isPastDue(i.assignment, now))
    const expected = due.reduce((sum, i) => sum + i.progress.total, 0)
    const submitted = due.reduce((sum, i) => sum + i.progress.submitted, 0)
    return {
      active: active.length,
      pending: inGroup.reduce((sum, i) => sum + i.progress.pending, 0),
      overdue: active.filter((i) => isPastDue(i.assignment, now)).length,
      completion: percent(submitted, expected),
    }
  }, [inGroup, now])

  const setFilter = (patch: Record<string, string | null>) => {
    updateQuery(patch)
    setPage(1)
  }

  return (
    <div className="animate-fade-in grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <PageHeader
          title="Topshiriqlar"
          description="Uy vazifalari, javoblarni tekshirish va baholash"
          actions={
            <Button icon={Plus} size="lg" onClick={() => openModal({ type: 'assignment-form', groupId: groupId === 'all' ? undefined : groupId })}>
              Yangi topshiriq
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
          <MetricCard label="Faol topshiriqlar" value={totals.active} icon={ClipboardList} color="blue" hint={`Jami ${inGroup.length} ta`} onClick={() => setFilter({ status: 'active' })} />
          <MetricCard label="Tekshirilmagan javoblar" value={totals.pending} icon={Inbox} color="amber" hint="Baholashni kutmoqda" onClick={() => setFilter({ status: 'review' })} />
          <MetricCard label="Muddati o'tgan" value={totals.overdue} icon={CalendarX2} color="rose" hint="Hali yakunlanmagan" onClick={() => setFilter({ status: 'overdue' })} />
          <MetricCard label="Topshirish darajasi" value={`${totals.completion}%`} icon={Percent} color="green" progress={totals.completion} />
        </div>

        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 min-[1800px]:flex-row min-[1800px]:items-center min-[1800px]:justify-between">
            <FilterPills<StatusFilter>
              size="sm"
              label="Topshiriq holati"
              value={status}
              onChange={(value) => setFilter({ status: value === 'all' ? null : value })}
              items={[
                { value: 'all', label: 'Barchasi', count: counts.all },
                { value: 'active', label: 'Faol', count: counts.active },
                { value: 'review', label: 'Tekshirish kerak', count: counts.review },
                { value: 'overdue', label: "Muddati o'tgan", count: counts.overdue },
                { value: 'closed', label: 'Yakunlangan', count: counts.closed },
              ]}
            />
            <div className="grid gap-2 sm:grid-cols-3 min-[1800px]:w-[560px]">
              <SearchInput
                size="sm"
                value={query}
                onChange={(value) => {
                  setQuery(value)
                  setPage(1)
                }}
                placeholder="Topshiriq qidirish..."
                aria-label="Topshiriq qidirish"
              />
              <Select size="sm" value={groupId} onChange={(value) => setFilter({ group: value === 'all' ? null : value })} options={groupOptions} aria-label="Guruh" />
              <Select<SortKey>
                size="sm"
                value={sort}
                onChange={setSort}
                aria-label="Saralash"
                options={[
                  { value: 'due', label: "Muddat bo'yicha" },
                  { value: 'newest', label: 'Eng yangi' },
                  { value: 'pending', label: 'Tekshirilmaganlar' },
                ]}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {slice.length === 0 ? (
              <EmptyState
                icon={assignments.length === 0 ? ClipboardList : FolderSearch}
                title={assignments.length === 0 ? "Hali topshiriq yo'q" : 'Topshiriq topilmadi'}
                message={assignments.length === 0 ? "O'quvchilarga birinchi vazifani bering." : "Filtr yoki qidiruvni o'zgartirib ko'ring."}
                action={
                  <Button icon={Plus} onClick={() => openModal({ type: 'assignment-form' })}>
                    Topshiriq berish
                  </Button>
                }
              />
            ) : (
              slice.map((item) => <AssignmentCard key={item.assignment.id} item={item} today={today} />)
            )}
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/60 sm:flex-row">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {visible.length} ta topshiriqdan {slice.length} tasi ko'rsatilmoqda
            </p>
            <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
          </div>
        </Card>
      </div>

      <aside ref={railRef} className="xl:sticky-rail" aria-label="Tekshirish navbati">
        <ReviewQueue
          assignments={groupId === 'all' ? assignments : assignments.filter((a) => a.groupId === groupId)}
          submissions={submissions}
          studentMap={studentMap}
          groupMap={groupMap}
        />
      </aside>
    </div>
  )
}
