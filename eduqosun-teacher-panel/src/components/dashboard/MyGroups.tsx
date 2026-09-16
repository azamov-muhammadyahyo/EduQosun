import { useMemo, useState } from 'react'
import { ChevronRight, Plus, Users } from 'lucide-react'
import { navigate, navigateTo } from '../../router'
import { rosterBreakdown } from '../../domain/students'
import { useActiveGroups, useLessonsOn, useStudents } from '../../hooks/useData'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { openModal } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { GroupTile } from '../ui/GroupIcon'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'
import { FilterPills } from '../ui/Tabs'

/** Bosh sahifadagi faol guruhlar jadvali (yo'nalish bo'yicha filtr bilan) */
export function MyGroups() {
  const groups = useActiveGroups()
  const students = useStudents()
  const assignments = useApp((s) => s.assignments)
  const { today } = useClock()
  const lessonsToday = useLessonsOn(today)
  const [filter, setFilter] = useState('all')

  const filters = useMemo(() => {
    const counts = new Map<string, number>()
    for (const group of groups) counts.set(group.direction, (counts.get(group.direction) ?? 0) + 1)
    return [
      { value: 'all', label: 'Barchasi', count: groups.length },
      ...[...counts.entries()].map(([direction, count]) => ({ value: direction, label: direction, count })),
    ]
  }, [groups])

  // Filtrdagi yo'nalish endi mavjud bo'lmasa — "Barchasi"ga qaytamiz
  const activeFilter = filters.some((f) => f.value === filter) ? filter : 'all'

  const rows = useMemo(
    () =>
      groups
        .filter((group) => activeFilter === 'all' || group.direction === activeFilter)
        .map((group) => ({
          group,
          students: rosterBreakdown(students, group.id).active,
          lessons: lessonsToday.filter((l) => l.groupId === group.id && !l.canceled).length,
          tasks: assignments.filter((a) => a.groupId === group.id && a.status === 'active' && a.dueDate >= today).length,
        })),
    [groups, activeFilter, students, lessonsToday, assignments, today],
  )

  return (
    <SectionCard
      title="Guruhlarim"
      icon={Users}
      className="h-full"
      action={<SeeAllLink label="Barcha guruhlar" onClick={() => navigateTo('groups')} />}
      bodyClassName="p-4"
    >
      <FilterPills items={filters} value={activeFilter} onChange={setFilter} size="sm" label="Yo'nalish" />

      {rows.length > 0 ? (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-400 dark:text-slate-500">
              <th scope="col" className="pb-2 pr-2 font-medium">
                Guruh
              </th>
              <th scope="col" className="hidden px-2 pb-2 font-medium sm:table-cell">
                O'quvchilar
              </th>
              <th scope="col" className="px-2 pb-2 font-medium">
                Faoliyat
              </th>
              <th scope="col" className="pb-2 pl-2">
                <span className="sr-only">Ochish</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {rows.map(({ group, students: count, lessons, tasks }) => (
              <tr
                key={group.id}
                onClick={() => navigate(`groups/${group.id}`)}
                className="group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
              >
                <td className="py-2.5 pr-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <GroupTile icon={group.icon} color={group.color} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                        {group.name} ({group.direction})
                      </span>
                      <span className="block truncate text-xs text-slate-400 sm:hidden">{count} o'quvchi</span>
                    </span>
                  </div>
                </td>
                <td className="hidden whitespace-nowrap px-2 py-2.5 tabular-nums text-slate-600 dark:text-slate-300 sm:table-cell">
                  {count}
                </td>
                <td className="px-2 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                  Bugun: {lessons} dars · {tasks} faol topshiriq
                </td>
                <td className="py-2.5 pl-2 text-right">
                  <ChevronRight
                    className="ml-auto h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600"
                    aria-hidden="true"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState
          className="mt-2"
          icon={Users}
          message="Faol guruh yo'q"
          action={
            <Button size="sm" variant="soft" icon={Plus} onClick={() => openModal({ type: 'group-form' })}>
              Guruh yaratish
            </Button>
          }
        />
      )}
    </SectionCard>
  )
}
