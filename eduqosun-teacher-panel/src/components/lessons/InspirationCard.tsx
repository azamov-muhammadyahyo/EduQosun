import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { quotes } from '../../data/catalog'
import { dayOfMonth, todayKey } from '../../lib/date'
import { TeacherIllustration } from './TeacherIllustration'

/** Ilhomlantiruvchi kartochka: har kuni yangi iqtibos, strelka — keyingisi */
export function InspirationCard() {
  const [index, setIndex] = useState(() => (dayOfMonth(todayKey()) + 2) % quotes.length)
  const quote = quotes[index]

  return (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:via-slate-800 dark:to-indigo-500/10">
      <TeacherIllustration className="h-20 w-24 shrink-0 2xl:h-24 2xl:w-28" />
      <div className="min-w-0 pb-6">
        <p className="text-sm font-bold leading-snug text-slate-900 dark:text-white">{quote.title}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{quote.subtitle}</p>
      </div>
      <button
        type="button"
        onClick={() => setIndex((value) => (value + 1) % quotes.length)}
        className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/30 transition-transform hover:translate-x-0.5 hover:bg-blue-700"
        aria-label="Keyingi iqtibos"
      >
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
