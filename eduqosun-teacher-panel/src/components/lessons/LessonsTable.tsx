import { useMemo, useState } from 'react'
import { BookOpen, Download } from 'lucide-react'
import type { DateKey, LessonPhase } from '../../types'
import { lessonKindLabel } from '../../data/catalog'
import { addDays, formatNumericDate, weekdayShort } from '../../lib/date'
import { downloadCsv } from '../../lib/download'
import { matchesQuery } from '../../lib/text'
import { summarize } from '../../domain/attendance'
import { lessonPhase } from '../../domain/lessons'
import { useGroupMap, useLessonsInRange } from '../../hooks/useData'
import { useGroupOptions } from '../../hooks/useOptions'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { notify } from '../../store/toastStore'
import { openDrawer } from '../../store/uiStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { SearchInput, Select } from '../ui/Form'
import { GroupCodeTile } from '../ui/GroupIcon'
import { Menu } from '../ui/Menu'
import { Pagination, paginate } from '../ui/Pagination'
import { LessonPhaseBadge } from '../ui/StatusBadges'
import { FilterPills } from '../ui/Tabs'
import { lessonMenuItems } from './lessonActions'

type StatusFilter = 'all' | 'held' | 'planned' | 'canceled'
type RangeKey = 'past30' | 'next14' | 'past90'

const PAGE_SIZE = 10

const ranges: { value: RangeKey; label: string; from: number; to: number }[] = [
  { value: 'past30', label: "So'nggi 30 kun", from: -30, to: 0 },
  { value: 'next14', label: 'Kelgusi 14 kun', from: 0, to: 14 },
  { value: 'past90', label: "So'nggi 3 oy", from: -90, to: 0 },
]

function statusOf(phase: LessonPhase): Exclude<StatusFilter, 'all'> {
  if (phase === 'held') return 'held'
  if (phase === 'canceled') return 'canceled'
  return 'planned'
}

/** "Darslar ro'yxati" — qidiruv, filtrlar, sahifalash va CSV eksport */
export function LessonsTable({ initialGroup = 'all' }: { initialGroup?: string }) {
  const { today, minutes } = useClock()
  const [range, setRange] = useState<RangeKey>('past30')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [groupId, setGroupId] = useState(initialGroup)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const selectedRange = ranges.find((r) => r.value === range) ?? ranges[0]
  const from: DateKey = addDays(today, selectedRange.from)
  const to: DateKey = addDays(today, selectedRange.to)
  const lessons = useLessonsInRange(from, to)
  const groupMap = useGroupMap()
  const attendance = useApp((s) => s.attendance)
  const groupOptions = useGroupOptions({ includeCompleted: true, allLabel: 'Barcha guruhlar' })

  const rows = useMemo(() => {
    const list = lessons
      .map((lesson) => ({ lesson, phase: lessonPhase(lesson, today, minutes) }))
      .filter(({ lesson }) => groupId === 'all' || lesson.groupId === groupId)
      .filter(({ lesson }) => {
        const group = groupMap.get(lesson.groupId)
        return matchesQuery(query, lesson.topic, group?.name, group?.subject, group?.course)
      })
    // O'tganlar — eng yangisi tepada, kelgusilar — eng yaqini tepada
    return range === 'next14'
      ? list.sort((a, b) => (a.lesson.date + a.lesson.start).localeCompare(b.lesson.date + b.lesson.start))
      : list.sort((a, b) => (b.lesson.date + b.lesson.start).localeCompare(a.lesson.date + a.lesson.start))
  }, [lessons, today, minutes, groupId, query, groupMap, range])

  const counts = useMemo(() => {
    const result = { all: rows.length, held: 0, planned: 0, canceled: 0 }
    for (const row of rows) result[statusOf(row.phase)] += 1
    return result
  }, [rows])

  const filtered = status === 'all' ? rows : rows.filter((row) => statusOf(row.phase) === status)
  const { slice, pageCount, page: safePage } = paginate(filtered, page, PAGE_SIZE)

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const exportCsv = () => {
    downloadCsv(`darslar-${from}-${to}`, [
      ['Sana', 'Kun', 'Vaqt', 'Guruh', 'Fan', 'Mavzu', 'Turi', 'Xona', 'Keldi', 'Jami belgilangan', 'Holat'],
      ...filtered.map(({ lesson, phase }) => {
        const group = groupMap.get(lesson.groupId)
        const summary = summarize(attendance[lesson.key])
        return [
          formatNumericDate(lesson.date),
          weekdayShort(lesson.date),
          `${lesson.start}–${lesson.end}`,
          group?.name,
          group?.subject,
          lesson.topic,
          lessonKindLabel[lesson.kind],
          lesson.room,
          summary.present + summary.late,
          summary.total,
          phase === 'held' ? "O'tkazildi" : phase === 'canceled' ? 'Bekor qilingan' : 'Rejalashtirilgan',
        ]
      }),
    ])
    notify.success('Fayl yuklab olindi', `${filtered.length} ta dars CSV formatida saqlandi.`)
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterPills<StatusFilter>
          size="sm"
          label="Dars holati"
          value={status}
          onChange={resetPage(setStatus)}
          items={[
            { value: 'all', label: 'Barchasi', count: counts.all },
            { value: 'held', label: "O'tkazilgan", count: counts.held },
            { value: 'planned', label: 'Rejalashtirilgan', count: counts.planned },
            { value: 'canceled', label: 'Bekor qilingan', count: counts.canceled },
          ]}
        />
        <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={filtered.length === 0}>
          CSV yuklab olish
        </Button>
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <SearchInput size="sm" value={query} onChange={resetPage(setQuery)} placeholder="Mavzu yoki guruhni qidiring..." aria-label="Dars qidirish" />
        <Select size="sm" value={groupId} onChange={resetPage(setGroupId)} options={groupOptions} aria-label="Guruh" />
        <Select size="sm" value={range} onChange={resetPage(setRange)} options={ranges} aria-label="Davr" />
      </div>

      {slice.length === 0 ? (
        <EmptyState icon={BookOpen} title="Dars topilmadi" message="Filtr yoki qidiruv so'zini o'zgartirib ko'ring." />
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-600 dark:bg-slate-700/30 dark:text-slate-300">
              <th scope="col" className="rounded-l-lg px-2.5 py-3 font-semibold">
                Dars
              </th>
              <th scope="col" className="hidden px-2.5 py-3 font-semibold md:table-cell">
                Sana / Vaqt
              </th>
              <th scope="col" className="hidden px-2.5 py-3 font-semibold min-[1440px]:table-cell">
                Davomat
              </th>
              <th scope="col" className="px-2.5 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="rounded-r-lg px-2.5 py-3 text-right font-semibold">
                <span className="sr-only">Amallar</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {slice.map(({ lesson, phase }) => {
              const group = groupMap.get(lesson.groupId)
              if (!group) return null
              const record = attendance[lesson.key]
              const summary = summarize(record)
              return (
                <tr
                  key={lesson.key}
                  onClick={() => openDrawer({ type: 'lesson', lessonKey: lesson.key })}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                >
                  <td className="px-2.5 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <GroupCodeTile name={group.name} color={group.color} size="sm" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium text-slate-800 dark:text-slate-100">{lesson.topic}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {group.subject}
                          {lesson.number ? ` · ${lesson.number}-dars` : " · qo'shimcha"}
                        </p>
                        <p className="mt-0.5 text-xs tabular-nums text-slate-400 md:hidden">
                          {formatNumericDate(lesson.date)} · {lesson.start} – {lesson.end}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-2.5 py-3 md:table-cell">
                    <div className="tabular-nums text-slate-700 dark:text-slate-200">
                      {formatNumericDate(lesson.date)} <span className="text-xs text-slate-400">{weekdayShort(lesson.date)}</span>
                    </div>
                    <div className="text-xs tabular-nums text-slate-400">
                      {lesson.start} – {lesson.end}
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-2.5 py-3 text-xs min-[1440px]:table-cell">
                    {phase !== 'held' ? (
                      <span className="text-slate-400">—</span>
                    ) : record ? (
                      <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">
                        {summary.present + summary.late}/{summary.total} keldi
                      </span>
                    ) : (
                      <Badge color="amber" size="xs">
                        Olinmagan
                      </Badge>
                    )}
                  </td>
                  <td className="px-2.5 py-3">
                    <LessonPhaseBadge phase={phase} size="xs" />
                  </td>
                  <td className="px-2.5 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                    <Menu label={`${lesson.topic} — amallar`} items={lessonMenuItems(lesson, group)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <div className="mt-2 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/60 sm:flex-row">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Jami {filtered.length} ta darsdan {slice.length} tasi ko'rsatilmoqda
        </p>
        <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  )
}
