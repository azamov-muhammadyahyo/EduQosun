import { useMemo, useState } from 'react'
import { ChevronRight, Users } from 'lucide-react'
import { groupFilters, groups } from '../../data/groups'
import type { GroupFilter } from '../../types'
import { accent } from '../../lib/colors'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'
import { EmptyState } from '../ui/EmptyState'

/** Guruhlarim — jadval ko'rinishida (§7.8) */
export function MyGroups() {
  const [activeFilter, setActiveFilter] = useState<GroupFilter['id']>('all')

  const visibleGroups = useMemo(
    () => (activeFilter === 'all' ? groups : groups.filter((group) => group.grade === activeFilter)),
    [activeFilter],
  )

  return (
    <SectionCard
      title="Guruhlarim"
      icon={Users}
      action={<SeeAllLink label="Barcha guruhlar" />}
      bodyClassName="p-4"
    >
      {/* Filtr "chip"lari */}
      <div className="flex flex-wrap gap-2">
        {groupFilters.map((filter) => {
          const isActive = filter.id === activeFilter
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              aria-pressed={isActive}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          )
        })}
      </div>

      {visibleGroups.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-400 dark:text-slate-500">
                <th scope="col" className="pb-2 pr-2 font-medium">
                  Guruh
                </th>
                <th scope="col" className="px-2 pb-2 font-medium">
                  O'quvchilar
                </th>
                <th scope="col" className="px-2 pb-2 font-medium">
                  Faoliyat
                </th>
                <th scope="col" className="pb-2 pl-2">
                  <span className="sr-only">Amal</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {visibleGroups.map((group) => {
                const c = accent[group.color]
                return (
                  <tr
                    key={group.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${c.solidBg}`}
                        >
                          <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span className="whitespace-nowrap font-medium text-slate-800 dark:text-slate-100">
                          {group.name} ({group.subject})
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-slate-600 dark:text-slate-300">
                      {group.studentCount}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                      {group.activity}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <ChevronRight
                        className="ml-auto h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600"
                        aria-hidden="true"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState message="Bu toifada guruh yo'q" icon={Users} />
        </div>
      )}
    </SectionCard>
  )
}
