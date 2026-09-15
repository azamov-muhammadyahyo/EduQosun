import { ChevronRight, Settings2 } from 'lucide-react'
import { quickActions } from '../../data/quickActions'
import { SectionCard } from '../ui/SectionCard'
import { IconBox } from '../ui/IconBox'

/** Tezkor amallar (§7.6) */
export function QuickActions() {
  return (
    <SectionCard title="Tezkor amallar" icon={Settings2} bodyClassName="p-3">
      <ul className="space-y-1">
        {quickActions.map((action) => (
          <li key={action.id}>
            <button
              type="button"
              className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              <IconBox icon={action.icon} color={action.color} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {action.title}
                </span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                  {action.description}
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400 dark:text-slate-600"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
