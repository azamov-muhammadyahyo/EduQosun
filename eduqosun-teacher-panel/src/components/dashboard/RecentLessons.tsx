import { History } from 'lucide-react'
import { recentLessons } from '../../data/recentLessons'
import { accent } from '../../lib/colors'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'
import { StatusBadge } from '../ui/StatusBadge'

/** Oxirgi darslar (§7.11) */
export function RecentLessons() {
  return (
    <SectionCard
      title="Oxirgi darslar"
      icon={History}
      action={<SeeAllLink />}
      className="h-full"
      bodyClassName="pb-2"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/30 dark:text-slate-400">
              <th scope="col" className="py-2.5 pl-5 pr-3 font-medium">Sana</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Guruh</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Mavzu</th>
              <th scope="col" className="py-2.5 pl-3 pr-5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {recentLessons.map((lesson) => {
              const c = accent[lesson.color]
              return (
                <tr
                  key={lesson.id}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                >
                  {/* Sana (yuqorida) + vaqt (pastda) */}
                  <td className="whitespace-nowrap py-3 pl-5 pr-3">
                    <p className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{lesson.date}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-slate-400">
                      {lesson.timeStart} – {lesson.timeEnd}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                      {lesson.group}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${c.iconBg} ${c.iconText}`}
                        aria-hidden="true"
                      >
                        {lesson.badge}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">{lesson.topic}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                    <StatusBadge status={lesson.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
