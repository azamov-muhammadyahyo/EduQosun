import { Heart } from 'lucide-react'
import { TeacherIllustration } from './TeacherIllustration'

/** Ilhomlantiruvchi kartochka: illyustratsiya (chapda) + shior (o'ngda) — Darslarim sahifasi */
export function InspirationCard() {
  return (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:via-slate-800 dark:to-indigo-500/10">
      <TeacherIllustration className="h-20 w-24 shrink-0 2xl:h-24 2xl:w-28" />
      <div className="min-w-0 pr-5">
        <p className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
          Yaxshi o'qituvchi — bu ilhom manbai!
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Har bir dars — yangi imkoniyat.</p>
      </div>
      <button
        type="button"
        className="absolute right-3 top-3 rounded-md p-1 text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:text-blue-400 dark:hover:bg-blue-500/20"
        aria-label="Yoqtirish"
      >
        <Heart className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
