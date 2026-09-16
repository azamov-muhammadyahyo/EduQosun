import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRightLeft, CircleCheck, FolderSearch, GraduationCap, Plus, UserMinus, Users, UsersRound } from 'lucide-react'
import type { Group } from '../types'
import { directions } from '../data/catalog'
import { addDays, dateKeyOfIso } from '../lib/date'
import { percent } from '../lib/format'
import { matchesQuery } from '../lib/text'
import { rosterBreakdown } from '../domain/students'
import { useMediaQuery } from '../hooks/useDom'
import { useRoute, navigate, navigateTo } from '../router'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { deleteGroup, setGroupStatus } from '../store/actions/groups'
import { runWithUndo } from '../store/actions/undo'
import { notify } from '../store/toastStore'
import { confirmAction, openDrawer, openModal } from '../store/uiStore'
import { GroupCard, type GroupCardActions } from '../components/groups/GroupCard'
import { GroupDetailPanel } from '../components/groups/GroupDetailPanel'
import { GroupsInsights } from '../components/groups/GroupsInsights'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SearchInput, Select } from '../components/ui/Form'
import { MetricCard } from '../components/ui/MetricCard'
import { PageHeader } from '../components/ui/PageHeader'
import { FilterPills } from '../components/ui/Tabs'

type StatusFilter = 'all' | 'active' | 'completed'
type SortKey = 'newest' | 'oldest' | 'name' | 'students'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Eng yangi' },
  { value: 'oldest', label: 'Eng eski' },
  { value: 'name', label: "Nomi bo'yicha" },
  { value: 'students', label: "O'quvchilar soni" },
]

export function GroupsPage() {
  const groups = useApp((s) => s.groups)
  const students = useApp((s) => s.students)
  const { today } = useClock()
  const route = useRoute()
  const wide = useMediaQuery('(min-width: 1440px)')

  const [status, setStatus] = useState<StatusFilter>('all')
  const [direction, setDirection] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [query, setQuery] = useState('')

  const breakdowns = useMemo(() => new Map(groups.map((g) => [g.id, rosterBreakdown(students, g.id)])), [groups, students])
  const members = useMemo(() => {
    const map = new Map<string, typeof students>()
    for (const student of students) {
      if (student.status !== 'active' && student.status !== 'graduated') continue
      const list = map.get(student.groupId)
      if (list) list.push(student)
      else map.set(student.groupId, [student])
    }
    return map
  }, [students])

  const counts = useMemo(
    () => ({
      all: groups.length,
      active: groups.filter((g) => g.status === 'active').length,
      completed: groups.filter((g) => g.status === 'completed').length,
    }),
    [groups],
  )

  const visible = useMemo(() => {
    const list = groups.filter(
      (g) =>
        (status === 'all' || g.status === status) &&
        (direction === 'all' || g.direction === direction) &&
        matchesQuery(query, g.name, g.course, g.subject, g.code),
    )
    const total = (g: Group) => breakdowns.get(g.id)?.total ?? 0
    return list.sort((a, b) => {
      // Faol guruhlar doim yuqorida
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1
      switch (sort) {
        case 'oldest':
          return a.createdAt.localeCompare(b.createdAt)
        case 'name':
          return a.course.localeCompare(b.course, 'uz')
        case 'students':
          return total(b) - total(a)
        default:
          return b.createdAt.localeCompare(a.createdAt)
      }
    })
  }, [groups, status, direction, query, sort, breakdowns])

  const selectedId = route.param && groups.some((g) => g.id === route.param) ? route.param : (visible[0]?.id ?? null)
  const selected = groups.find((g) => g.id === selectedId) ?? null

  // Tor ekranda havola orqali kelinganda tafsilotlar yon panelda ochiladi (har parametr uchun bir marta)
  const handledParam = useRef<string | null>(null)
  useEffect(() => {
    if (wide || !route.param || handledParam.current === route.param) return
    handledParam.current = route.param
    if (groups.some((g) => g.id === route.param)) openDrawer({ type: 'group', groupId: route.param })
  }, [route.param, wide, groups])

  // Umumiy ko'rsatkichlar
  const total = useMemo(() => rosterBreakdown(students), [students])
  const monthAgo = addDays(today, -30)
  const lastMonth = students.filter((s) => s.joinedAt <= monthAgo && (!s.leftAt || s.leftAt > monthAgo)).length
  const current = students.filter((s) => s.joinedAt <= today && (!s.leftAt || s.leftAt > today)).length
  const growth = lastMonth > 0 ? Math.round(((current - lastMonth) / lastMonth) * 100) : 0
  const newGroups = groups.filter((g) => dateKeyOfIso(g.createdAt) >= monthAgo).length

  const open = useCallback((group: Group) => {
    handledParam.current = group.id
    navigate(`groups/${group.id}`, { replace: true })
    if (!window.matchMedia('(min-width: 1440px)').matches) openDrawer({ type: 'group', groupId: group.id })
  }, [])

  const actions: GroupCardActions = useMemo(
    () => ({
      onOpen: open,
      onEdit: (group) => openModal({ type: 'group-form', groupId: group.id }),
      onMessage: (group) => openModal({ type: 'compose', target: { kind: 'group', id: group.id } }),
      onAddStudent: (group) => openModal({ type: 'student-form', groupId: group.id }),
      onAttendance: (group) => navigateTo('attendance', null, { group: group.id }),
      onGrades: (group) => navigateTo('grades', null, { group: group.id }),
      onToggleStatus: async (group) => {
        const completing = group.status === 'active'
        const ok = await confirmAction({
          title: completing ? 'Kursni yakunlash' : 'Guruhni qayta faollashtirish',
          message: completing
            ? `«${group.course}» (${group.name}) kursi yakunlanadi. O'qiyotgan o'quvchilar "bitirgan" deb belgilanadi va guruh jadvaldan chiqadi.`
            : `«${group.course}» (${group.name}) guruhi qayta faol bo'ladi va darslari jadvalga qaytadi.`,
          confirmLabel: completing ? 'Yakunlash' : 'Faollashtirish',
          tone: completing ? 'danger' : 'primary',
        })
        if (!ok) return
        runWithUndo(completing ? 'Kurs yakunlandi' : 'Guruh faollashtirildi', () => setGroupStatus(group.id, completing ? 'completed' : 'active'), `${group.course} · ${group.name}`)
      },
      onDelete: async (group) => {
        const count = breakdowns.get(group.id)?.total ?? 0
        const ok = await confirmAction({
          title: "Guruhni o'chirish",
          message: `«${group.course}» (${group.name}) guruhi, undagi ${count} ta o'quvchi, davomat, baholar, topshiriq va testlar butunlay o'chiriladi.`,
          confirmLabel: "O'chirish",
        })
        if (!ok) return
        if (selectedId === group.id) navigate('groups', { replace: true })
        runWithUndo("Guruh o'chirildi", () => deleteGroup(group.id), `${group.course} · ${group.name}`)
      },
    }),
    [open, breakdowns, selectedId],
  )

  const directionOptions = [{ value: 'all', label: "Barcha yo'nalishlar" }, ...directions.map((d) => ({ value: d, label: d }))]

  return (
    <div className="animate-fade-in grid grid-cols-1 gap-6 min-[1440px]:grid-cols-[minmax(0,1fr)_340px] min-[1700px]:grid-cols-[minmax(0,1fr)_370px]">
      <div className="min-w-0 space-y-5">
        <PageHeader
          title="Guruhlarim"
          description="Sizning barcha guruhlaringiz va ularning holati"
          actions={
            <Button icon={Plus} size="lg" onClick={() => openModal({ type: 'group-form' })}>
              Yangi guruh yaratish
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
          <MetricCard
            label="Jami guruhlar"
            value={groups.length}
            icon={UsersRound}
            color="blue"
            hint={newGroups > 0 ? `${counts.active} ta faol · +${newGroups} yangi` : `${counts.active} tasi hozir faol`}
            onClick={() => setStatus('all')}
          />
          <MetricCard
            label="Jami o'quvchilar"
            value={total.total}
            icon={GraduationCap}
            color="green"
            trend={{ text: `${Math.abs(growth)}%`, direction: growth > 0 ? 'up' : growth < 0 ? 'down' : 'flat' }}
            hint="O'tgan oyga nisbatan"
            onClick={() => navigateTo('students')}
          />
          <MetricCard
            label="O'qiyotganlar"
            value={total.active}
            icon={CircleCheck}
            color="blue"
            progress={percent(total.active, total.total)}
            trend={{ text: `${percent(total.active, total.total)}%`, direction: 'up' }}
          />
          <MetricCard
            label="Guruhdan chiqqanlar"
            value={total.left}
            icon={UserMinus}
            color="rose"
            progress={percent(total.left, total.total)}
            trend={{ text: `${percent(total.left, total.total)}%`, direction: 'flat' }}
          />
          <MetricCard
            label="Guruhga o'tganlar"
            value={total.transferred}
            icon={ArrowRightLeft}
            color="violet"
            progress={percent(total.transferred, total.total)}
            trend={{ text: `${percent(total.transferred, total.total)}%`, direction: 'flat' }}
          />
        </div>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <FilterPills<StatusFilter>
              label="Guruh holati"
              items={[
                { value: 'all', label: 'Barcha guruhlar', count: counts.all },
                { value: 'active', label: 'Faol', count: counts.active },
                { value: 'completed', label: 'Tugagan', count: counts.completed },
              ]}
              value={status}
              onChange={setStatus}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <SearchInput value={query} onChange={setQuery} placeholder="Guruh qidirish..." size="sm" className="sm:w-48" />
              <Select size="sm" value={direction} onChange={setDirection} options={directionOptions} className="sm:w-48" aria-label="Yo'nalish" />
              <Select size="sm" value={sort} onChange={setSort} options={sortOptions} className="sm:w-40" aria-label="Saralash" />
            </div>
          </div>

          {visible.length > 0 ? (
            <div className="space-y-3">
              {visible.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  breakdown={breakdowns.get(group.id) ?? rosterBreakdown([], group.id)}
                  members={members.get(group.id) ?? []}
                  selected={wide && group.id === selectedId}
                  {...actions}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={groups.length === 0 ? Users : FolderSearch}
              title={groups.length === 0 ? "Hali guruh yo'q" : 'Guruh topilmadi'}
              message={groups.length === 0 ? "Birinchi guruhingizni yarating va o'quvchilarni qo'shing." : "Filtr yoki qidiruv so'zini o'zgartirib ko'ring."}
              action={
                groups.length === 0 ? (
                  <Button icon={Plus} onClick={() => openModal({ type: 'group-form' })}>
                    Guruh yaratish
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStatus('all')
                      setDirection('all')
                      setQuery('')
                      notify.info('Filtrlar tozalandi')
                    }}
                  >
                    Filtrlarni tozalash
                  </Button>
                )
              }
            />
          )}
        </Card>

        <GroupsInsights />
      </div>

      <aside className="hidden min-[1440px]:block" aria-label="Guruh tafsilotlari">
        {selected ? (
          <GroupDetailPanel group={selected} />
        ) : (
          <Card className="p-6">
            <EmptyState icon={Users} message="Tafsilotlarni ko'rish uchun guruhni tanlang." />
          </Card>
        )}
      </aside>
    </div>
  )
}
