import { Construction } from 'lucide-react'
import { allNav } from '../data/navigation'

/** Hali tayyor bo'lmagan bo'limlar uchun vaqtinchalik sahifa */
export function Placeholder({ pageId }: { pageId: string }) {
  const item = allNav.find((navItem) => navItem.id === pageId)
  const label = item?.label ?? "Bu bo'lim"
  const Icon = item?.icon ?? Construction

  return (
    <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{label}</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Bu bo'lim hozircha tayyorlanmoqda. Tez orada shu yerda "{label}" sahifasi paydo bo'ladi.
      </p>
    </div>
  )
}
