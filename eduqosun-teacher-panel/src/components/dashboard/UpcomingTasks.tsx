import { CalendarClock, ClipboardList, Pin } from 'lucide-react'
import { upcomingTasks } from '../../data/tasks'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'
import { IconBox } from '../ui/IconBox'
import { Button } from '../ui/Button'

/** Keyingi vazifalar (§7.12) */
export function UpcomingTasks() {
  return (
    <SectionCard
      title="Keyingi vazifalar"
      icon={Pin}
      action={<SeeAllLink />}
      className="h-full"
      bodyClassName="px-5 py-1"
    >
      <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {upcomingTasks.map((task) => (
          <li key={task.id} className="flex gap-3 py-3.5">
            <IconBox icon={ClipboardList} color={task.color} size="md" />
            <div className="min-w-0 flex-1">
              {/* Guruh + fan (chapda) · tugma (o'ngda) — tavsif to'liq kenglikni egallaydi */}
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                    {task.group}
                  </span>
                  <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {task.subject}
                  </span>
                </p>
                <Button variant="soft" size="sm" className="shrink-0">
                  Tekshirish
                </Button>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{task.description}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Muddat:{' '}
                  <span className="font-medium tabular-nums text-slate-600 dark:text-slate-300">{task.due}</span>
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
