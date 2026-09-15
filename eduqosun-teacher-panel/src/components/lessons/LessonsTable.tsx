import { useMemo, useState } from 'react'
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, MoreHorizontal, Search, Users } from 'lucide-react'
import { lessonListFilters, lessonsList } from '../../data/lessonsList'
import type { LessonListFilter } from '../../types'
import { accent } from '../../lib/colors'
import { Card } from '../ui/Card'
import { IconBox } from '../ui/IconBox'
import { LessonBadge } from '../ui/LessonBadge'
import { EmptyState } from '../ui/EmptyState'

/**
 * Jadval gorizontal scroll'siz kartaga sig'ishi uchun ikkinchi darajali ustunlar
 * faqat yetarli kenglikda ko'rinadi. Yashiringan "Fan" va "Sana / Vaqt" dars nomi ostida chiqadi.
 */
const col = {
  group: 'hidden sm:table-cell',
  subject: 'hidden min-[1680px]:table-cell',
  subjectInline: 'min-[1680px]:hidden',
  date: 'hidden md:table-cell',
  dateInline: 'md:hidden',
  students: 'hidden min-[1440px]:table-cell',
}

const cell = 'px-2 py-3 sm:px-2.5'
const headCell = 'px-2 py-3 font-semibold sm:px-2.5'

/** "Darslar ro'yxati" — qidiruv + tab-filtr + jadval */
export function LessonsTable() {
  const [activeFilter, setActiveFilter] = useState<LessonListFilter['id']>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return lessonsList.filter((lesson) => {
      const matchesFilter = activeFilter === 'all' || lesson.status === activeFilter
      const matchesQuery =
        q === '' || lesson.title.toLowerCase().includes(q) || lesson.group.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [activeFilter, query])

  return (
    <Card className="flex flex-col">
      {/* Sarlavha (chapda) · qidiruv + tab-filtrlar (o'ngda) */}
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <IconBox icon={CalendarDays} color="blue" size="sm" />
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Darslar ro'yxati</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Barcha darslaringizni ko'rish va boshqarish
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:max-w-md lg:items-end">
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Dars qidirish"
              placeholder="Dars nomi yoki guruhni qidiring..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {lessonListFilters.map((filter) => {
              const isActive = filter.id === activeFilter
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-4 pb-5 sm:px-5">
        {/* Jadval — kartaga to'liq sig'adi, gorizontal scroll yo'q */}
        {filtered.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-600 dark:bg-slate-700/30 dark:text-slate-300">
                <th scope="col" className={`${headCell} rounded-l-lg`}>#</th>
                <th scope="col" className={headCell}>Dars nomi</th>
                <th scope="col" className={`${headCell} ${col.group}`}>Guruh</th>
                <th scope="col" className={`${headCell} ${col.subject}`}>Fan</th>
                <th scope="col" className={`${headCell} ${col.date}`}>Sana / Vaqt</th>
                <th scope="col" className={`${headCell} ${col.students}`}>O'quvchilar</th>
                <th scope="col" className={headCell}>Status</th>
                <th scope="col" className={`${headCell} rounded-r-lg text-right`}>
                  <span className="sr-only sm:not-sr-only">Amallar</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.map((lesson) => {
                const c = accent[lesson.color]
                return (
                  <tr
                    key={lesson.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                  >
                    <td className={`${cell} font-semibold tabular-nums text-slate-700 dark:text-slate-300`}>
                      {lesson.index}
                    </td>
                    <td className={cell}>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-white shadow-sm ${
                            lesson.badge.length > 2 ? 'text-[8px]' : 'text-[11px]'
                          } ${c.solidBg}`}
                          aria-hidden="true"
                        >
                          {lesson.badge}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium leading-snug text-slate-800 dark:text-slate-100">{lesson.title}</p>
                          <p className={`mt-0.5 text-xs text-slate-500 dark:text-slate-400 ${col.subjectInline}`}>
                            {lesson.subject}
                          </p>
                          <p className={`mt-0.5 text-xs tabular-nums text-slate-400 ${col.dateInline}`}>
                            {lesson.date} · {lesson.timeStart} – {lesson.timeEnd}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${cell} whitespace-nowrap text-slate-600 dark:text-slate-300 ${col.group}`}>
                      {lesson.group}
                    </td>
                    <td className={`${cell} text-slate-500 dark:text-slate-400 ${col.subject}`}>{lesson.subject}</td>
                    <td className={`${cell} whitespace-nowrap ${col.date}`}>
                      <div className="tabular-nums text-slate-700 dark:text-slate-200">{lesson.date}</div>
                      <div className="text-xs tabular-nums text-slate-400">
                        {lesson.timeStart} – {lesson.timeEnd}
                      </div>
                    </td>
                    <td className={`${cell} whitespace-nowrap ${col.students}`}>
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        {lesson.studentCount}
                      </span>
                    </td>
                    <td className={cell}>
                      <LessonBadge status={lesson.status} />
                    </td>
                    <td className={`${cell} text-right`}>
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                        aria-label={`${lesson.title} — amallar`}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState message="Bunday dars topilmadi" icon={BookOpen} />
        )}

        {/* Pastki qism: sanoq + sahifalash */}
        <div className="mt-2 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/60 sm:flex-row">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jami {lessonsList.length} ta darsdan {filtered.length} tasi ko'rsatilmoqda
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              aria-label="Oldingi sahifa"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-current="page"
              className="h-8 w-8 rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-sm shadow-blue-600/30"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              aria-label="Keyingi sahifa"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
