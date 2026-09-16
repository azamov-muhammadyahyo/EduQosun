import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import type { DateKey } from '../../types'
import { formatDayMonth } from '../../lib/date'
import { lessonPhase } from '../../domain/lessons'
import { useLessonMarkers, useLessonsOn } from '../../hooks/useData'
import { useClock } from '../../store/clock'
import { openModal } from '../../store/uiStore'
import { Card } from '../ui/Card'
import { MiniCalendar } from '../ui/MiniCalendar'

interface CalendarWidgetProps {
  selected: DateKey
  onSelect: (date: DateKey) => void
}

/** Kun taqvimi: darsli kunlar nuqta bilan belgilanadi, kun tanlansa jadval shu kunga o'tadi */
export function CalendarWidget({ selected, onSelect }: CalendarWidgetProps) {
  const { today, minutes } = useClock()
  const [month, setMonth] = useState(selected)
  const markers = useLessonMarkers(month)
  const lessons = useLessonsOn(selected)

  // Tashqaridan (masalan, jadval strelkalari bilan) boshqa kun tanlansa, taqvim shu oyga o'tadi
  useEffect(() => setMonth(selected), [selected])

  const summary = useMemo(() => {
    const active = lessons.filter((l) => !l.canceled)
    const held = active.filter((l) => lessonPhase(l, today, minutes) === 'held').length
    const prefix = selected === today ? 'Bugun' : formatDayMonth(selected)
    if (active.length === 0) return { title: `${prefix} dars yo'q`, subtitle: "Yangi dars qo'shish uchun bosing." }
    if (selected < today) return { title: `${prefix} ${active.length} ta dars bo'lgan`, subtitle: `${held} tasi o'tkazildi.` }
    if (selected > today) return { title: `${prefix} ${active.length} ta dars bor`, subtitle: 'Barchasi rejalashtirilgan.' }
    return {
      title: `Bugun ${active.length} ta dars bor`,
      subtitle: `${held} ta dars o'tkazildi, ${active.length - held} ta dars qolmoqda.`,
    }
  }, [lessons, selected, today, minutes])

  const empty = lessons.every((l) => l.canceled)

  return (
    <Card className="flex h-full flex-col p-5">
      <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Kun taqvimi</h2>
      <MiniCalendar
        month={month}
        onMonthChange={setMonth}
        selected={selected}
        onSelect={onSelect}
        today={today}
        markers={markers}
        compact
      />
      <div className="min-h-4 flex-1" aria-hidden="true" />
      <button
        type="button"
        onClick={() => (empty ? openModal({ type: 'lesson-form', date: selected }) : undefined)}
        className="flex items-start gap-3 rounded-xl bg-blue-50/70 p-3 text-left enabled:hover:bg-blue-100/70 dark:bg-blue-500/10"
        disabled={!empty}
      >
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
          {empty ? <CalendarPlus className="h-4 w-4" aria-hidden="true" /> : <CalendarDays className="h-4 w-4" aria-hidden="true" />}
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{summary.title}</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">{summary.subtitle}</span>
        </span>
      </button>
    </Card>
  )
}
