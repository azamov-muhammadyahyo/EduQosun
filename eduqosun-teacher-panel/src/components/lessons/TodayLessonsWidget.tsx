import { ArrowRight, CalendarCheck, CalendarDays, ChevronRight } from 'lucide-react'
import { todaySchedule } from '../../data/schedule'
import { accent } from '../../lib/colors'
import { Card } from '../ui/Card'
import { PanelHeader } from '../ui/PanelHeader'
import { EmptyState } from '../ui/EmptyState'

/** "Bugungi darslar" o'ng ustun vidjeti (Darslarim sahifasi) */
export function TodayLessonsWidget() {
  return (
    <Card className="flex flex-col">
      <PanelHeader
        title="Bugungi darslar"
        icon={CalendarCheck}
        className="px-5 pb-4 pt-5"
        action={
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {todaySchedule.length} ta dars
          </span>
        }
      />

      {todaySchedule.length > 0 ? (
        <ul className="mx-5 divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-700/60 dark:border-slate-700/60">
          {todaySchedule.map((lesson) => {
            const c = accent[lesson.color ?? 'blue']
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  className="group flex w-full items-center gap-3 py-3 text-left"
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${c.solidBg}`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {/* Vaqt (yuqorida) + guruh (pastda) */}
                  <span className="shrink-0">
                    <span className="block text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {lesson.timeStart} – {lesson.timeEnd}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{lesson.group}</span>
                  </span>
                  <span className="min-w-0 flex-1 break-words text-xs leading-snug text-slate-700 transition-colors group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400">
                    {lesson.title}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-slate-500"
                    aria-hidden="true"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState message="Bugun rejalashtirilgan dars yo'q" icon={CalendarDays} />
      )}

      <div className="p-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-700/30 dark:text-blue-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10"
        >
          Barcha darslar
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </Card>
  )
}
