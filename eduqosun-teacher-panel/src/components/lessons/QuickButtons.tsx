import { Zap } from 'lucide-react'
import { lessonQuickButtons } from '../../data/lessonsList'
import { accent } from '../../lib/colors'
import { Card } from '../ui/Card'
import { PanelHeader } from '../ui/PanelHeader'

/** "Tezkor tugmalar" — 2x2 rangli amal plitkalari (Darslarim sahifasi) */
export function QuickButtons() {
  return (
    <Card className="p-5">
      <PanelHeader title="Tezkor tugmalar" icon={Zap} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {lessonQuickButtons.map((button) => {
          const Icon = button.icon
          const c = accent[button.color]
          return (
            <button
              key={button.id}
              type="button"
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md xl:flex-col xl:items-start 2xl:flex-row 2xl:items-center ${c.softBorder} ${c.softBg}`}
            >
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.strongBg} ${c.iconText}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 text-xs font-medium leading-tight text-slate-700 dark:text-slate-200">
                {button.label}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
