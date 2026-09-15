import { CalendarDays, Plus } from 'lucide-react'
import { lessonsStats } from '../data/stats'
import { Button } from '../components/ui/Button'
import { LessonStats } from '../components/lessons/LessonStats'
import { LessonsTable } from '../components/lessons/LessonsTable'
import { TodayLessonsWidget } from '../components/lessons/TodayLessonsWidget'
import { LessonsDonut } from '../components/lessons/LessonsDonut'
import { QuickButtons } from '../components/lessons/QuickButtons'
import { InspirationCard } from '../components/lessons/InspirationCard'

/** Darslarim sahifasi: chap ustun (sarlavha · statistika · jadval) + o'ng ustun (vidjetlar, eng tepadan) */
export function Lessons() {
  return (
    <div className="animate-fade-in grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        {/* Sarlavha */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/25">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Darslarim</h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Sizning barcha darslaringiz, ularning jadvali va o'quvchilari bilan shu yerda
              </p>
            </div>
          </div>
          <Button variant="primary" size="md" className="shrink-0 self-start shadow-md shadow-blue-600/25 sm:self-auto">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Yangi dars qo'shish
          </Button>
        </div>

        <LessonStats items={lessonsStats} />

        <LessonsTable />
      </div>

      {/* O'ng ustun: kichik ekranda 2 ustunli to'r, xl'da bitta ustun */}
      <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
        <TodayLessonsWidget />
        <LessonsDonut />
        <QuickButtons />
        <InspirationCard />
      </div>
    </div>
  )
}
