import { useMemo, useState } from 'react'
import { FileQuestion, FolderSearch, Percent, Plus, Radio, UsersRound } from 'lucide-react'
import type { TestStatus } from '../types'
import { testStatusLabel } from '../data/catalog'
import { average } from '../lib/format'
import { matchesQuery } from '../lib/text'
import { currentRoster } from '../domain/students'
import { testSummary } from '../domain/tests'
import { useGroupMap, useStudentMap } from '../hooks/useData'
import { useGroupOptions } from '../hooks/useOptions'
import { updateQuery, useRoute } from '../router'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { openModal } from '../store/uiStore'
import { TestCard, type TestItem } from '../components/tests/TestCard'
import { TestsInsights } from '../components/tests/TestsInsights'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SearchInput, Select } from '../components/ui/Form'
import { MetricCard } from '../components/ui/MetricCard'
import { PageHeader } from '../components/ui/PageHeader'
import { FilterPills } from '../components/ui/Tabs'
import { useStickyRail } from '../hooks/useDom'

type StatusFilter = TestStatus | 'all'

const statuses: StatusFilter[] = ['all', 'published', 'draft', 'finished']

/** Status bo'yicha tartib: faol → qoralama → yakunlangan */
const statusRank: Record<TestStatus, number> = { published: 0, draft: 1, finished: 2 }

export function TestsPage() {
  const railRef = useStickyRail()
  const tests = useApp((s) => s.tests)
  const students = useApp((s) => s.students)
  const groupMap = useGroupMap()
  const studentMap = useStudentMap()
  const groupOptions = useGroupOptions({ includeCompleted: true, allLabel: 'Barcha guruhlar' })
  const { today } = useClock()
  const { query: params } = useRoute()

  const status = (statuses.includes(params.get('status') as StatusFilter) ? params.get('status') : 'all') as StatusFilter
  const groupId = params.get('group') ?? 'all'
  const [query, setQuery] = useState('')

  const items: TestItem[] = useMemo(
    () =>
      tests.map((test) => {
        const group = groupMap.get(test.groupId)
        return {
          test,
          group,
          summary: testSummary(test),
          rosterSize: group ? currentRoster(students, group).length : 0,
        }
      }),
    [tests, groupMap, students],
  )

  const inGroup = useMemo(() => items.filter((i) => groupId === 'all' || i.test.groupId === groupId), [items, groupId])

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: inGroup.length, draft: 0, published: 0, finished: 0 }
    for (const item of inGroup) result[item.test.status] += 1
    return result
  }, [inGroup])

  const visible = useMemo(
    () =>
      inGroup
        .filter((i) => status === 'all' || i.test.status === status)
        .filter((i) => matchesQuery(query, i.test.title, i.test.description, i.group?.name))
        .sort((a, b) => statusRank[a.test.status] - statusRank[b.test.status] || b.test.date.localeCompare(a.test.date)),
    [inGroup, status, query],
  )

  const totals = useMemo(() => {
    const withResults = inGroup.filter((i) => i.summary.averagePercent !== null)
    return {
      participants: inGroup.reduce((sum, i) => sum + i.summary.participants, 0),
      average: average(withResults.map((i) => i.summary.averagePercent ?? 0)),
    }
  }, [inGroup])

  const groupTests = groupId === 'all' ? tests : tests.filter((t) => t.groupId === groupId)

  return (
    <div className="animate-fade-in grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <PageHeader
          title="Testlar"
          description="Onlayn testlar yaratish, e'lon qilish va natijalarni tahlil qilish"
          actions={
            <Button icon={Plus} size="lg" onClick={() => openModal({ type: 'test-builder', groupId: groupId === 'all' ? undefined : groupId })}>
              Yangi test
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
          <MetricCard label="Jami testlar" value={inGroup.length} icon={FileQuestion} color="violet" hint={`${counts.draft} ta qoralama`} onClick={() => updateQuery({ status: null })} />
          <MetricCard label="Faol testlar" value={counts.published} icon={Radio} color="blue" hint="O'quvchilarga ochiq" onClick={() => updateQuery({ status: 'published' })} />
          <MetricCard
            label="O'rtacha natija"
            value={totals.average === null ? '—' : `${Math.round(totals.average)}%`}
            icon={Percent}
            color="green"
            progress={totals.average ?? 0}
          />
          <MetricCard label="Topshirishlar" value={totals.participants} icon={UsersRound} color="amber" hint="Barcha testlar bo'yicha" />
        </div>

        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <FilterPills<StatusFilter>
              size="sm"
              label="Test holati"
              value={status}
              onChange={(value) => updateQuery({ status: value === 'all' ? null : value })}
              items={statuses.map((value) => ({
                value,
                label: value === 'all' ? 'Barchasi' : testStatusLabel[value],
                count: counts[value],
              }))}
            />
            <div className="grid gap-2 sm:grid-cols-2 xl:w-[420px]">
              <SearchInput size="sm" value={query} onChange={setQuery} placeholder="Test qidirish..." aria-label="Test qidirish" />
              <Select size="sm" value={groupId} onChange={(value) => updateQuery({ group: value === 'all' ? null : value })} options={groupOptions} aria-label="Guruh" />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={tests.length === 0 ? FileQuestion : FolderSearch}
              title={tests.length === 0 ? "Hali test yo'q" : 'Test topilmadi'}
              message={tests.length === 0 ? "Birinchi testingizni yarating — savollar va javob variantlarini qo'shing." : "Filtr yoki qidiruvni o'zgartirib ko'ring."}
              action={
                <Button icon={Plus} onClick={() => openModal({ type: 'test-builder' })}>
                  Test yaratish
                </Button>
              }
            />
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {visible.map((item) => (
                <TestCard key={item.test.id} item={item} today={today} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <aside ref={railRef} className="xl:sticky-rail" aria-label="Testlar tahlili">
        <TestsInsights tests={groupTests} studentMap={studentMap} groupMap={groupMap} />
      </aside>
    </div>
  )
}
