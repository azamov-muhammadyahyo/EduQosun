import { CalendarDays } from 'lucide-react'
import { teacher } from '../../data/teacher'

/** Salomlashuv bloki — ixcham, stat kartalar bilan bir qatorda turadi (§7.3) */
export function WelcomeBanner() {
  return (
    <section className="flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-sky-50 to-white p-5 dark:border-slate-700/60 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-xl font-bold text-white shadow-lg shadow-blue-600/20"
        aria-hidden="true"
      >
        {teacher.initials}
      </div>
      <div className="min-w-0">
        <h1 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
          {teacher.greeting}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{teacher.subtitle}</p>
        <p className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-700">
          <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          {teacher.dateLabel}
        </p>
      </div>
    </section>
  )
}
