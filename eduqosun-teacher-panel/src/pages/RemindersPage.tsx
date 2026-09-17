import { useMemo, useState, type FormEvent } from 'react'
import { BellPlus, BellRing, CalendarCheck2, CalendarRange, ChevronDown, CircleCheckBig, Eraser, Plus, TriangleAlert, X } from 'lucide-react'
import type { AccentColor, DateKey, Reminder, ReminderCategory, ReminderPriority } from '../types'
import { reminderCategoryLabel, reminderPriorityLabel } from '../data/catalog'
import { accent } from '../lib/colors'
import { cn } from '../lib/cn'
import { addDays, formatDateWithWeekday, timeOf } from '../lib/date'
import { matchesQuery } from '../lib/text'
import { useGroupMap } from '../hooks/useData'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { clearCompletedReminders, createReminder } from '../store/actions/reminders'
import { runWithUndo } from '../store/actions/undo'
import { notify } from '../store/toastStore'
import { openModal } from '../store/uiStore'
import { ReminderItem, categoryColor } from '../components/reminders/ReminderItem'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SearchInput, Select, TextInput } from '../components/ui/Form'
import { MetricCard } from '../components/ui/MetricCard'
import { MiniCalendar } from '../components/ui/MiniCalendar'
import { PageHeader } from '../components/ui/PageHeader'
import { PanelHeader } from '../components/ui/PanelHeader'
import { FilterPills } from '../components/ui/Tabs'
import { useStickyRail } from '../hooks/useDom'

type CategoryFilter = ReminderCategory | 'all'
type PriorityFilter = ReminderPriority | 'all'

interface Section {
  id: string
  title: string
  tone: string
  items: Reminder[]
}

const priorityRank: Record<ReminderPriority, number> = { high: 0, medium: 1, low: 2 }

function byTime(a: Reminder, b: Reminder): number {
  return a.date.localeCompare(b.date) || (a.time ?? '99').localeCompare(b.time ?? '99') || priorityRank[a.priority] - priorityRank[b.priority]
}

export function RemindersPage() {
  const railRef = useStickyRail()
  const reminders = useApp((s) => s.reminders)
  const groupMap = useGroupMap()
  const { now, today } = useClock()
  const nowTime = timeOf(now)

  const [category, setCategory] = useState<CategoryFilter>('all')
  const [priority, setPriority] = useState<PriorityFilter>('all')
  const [query, setQuery] = useState('')
  const [day, setDay] = useState<DateKey | null>(null)
  const [month, setMonth] = useState(today)
  const [showDone, setShowDone] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')

  const filtered = useMemo(
    () =>
      reminders.filter(
        (r) =>
          (category === 'all' || r.category === category) &&
          (priority === 'all' || r.priority === priority) &&
          (!day || r.date === day) &&
          matchesQuery(query, r.title, r.note, r.groupId ? groupMap.get(r.groupId)?.name : undefined),
      ),
    [reminders, category, priority, day, query, groupMap],
  )

  const sections: Section[] = useMemo(() => {
    const open = filtered.filter((r) => !r.done).sort(byTime)
    const tomorrow = addDays(today, 1)
    const weekEnd = addDays(today, 7)
    const isOverdue = (r: Reminder) => r.date < today || (r.date === today && !!r.time && r.time < nowTime)
    return [
      { id: 'overdue', title: "Muddati o'tgan", tone: 'text-rose-600 dark:text-rose-400', items: open.filter(isOverdue) },
      { id: 'today', title: 'Bugun', tone: 'text-blue-600 dark:text-blue-400', items: open.filter((r) => r.date === today && !isOverdue(r)) },
      { id: 'tomorrow', title: 'Ertaga', tone: 'text-slate-700 dark:text-slate-200', items: open.filter((r) => r.date === tomorrow) },
      { id: 'week', title: 'Shu hafta', tone: 'text-slate-700 dark:text-slate-200', items: open.filter((r) => r.date > tomorrow && r.date <= weekEnd) },
      { id: 'later', title: 'Keyinroq', tone: 'text-slate-500 dark:text-slate-400', items: open.filter((r) => r.date > weekEnd) },
    ].filter((section) => section.items.length > 0)
  }, [filtered, today, nowTime])

  const done = useMemo(
    () => filtered.filter((r) => r.done).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? '')),
    [filtered],
  )

  const stats = useMemo(() => {
    const open = reminders.filter((r) => !r.done)
    const weekEnd = addDays(today, 7)
    return {
      today: open.filter((r) => r.date === today).length,
      overdue: open.filter((r) => r.date < today).length,
      week: open.filter((r) => r.date > today && r.date <= weekEnd).length,
      done: reminders.length - open.length,
    }
  }, [reminders, today])

  const markers = useMemo(() => {
    const result: Record<DateKey, AccentColor[]> = {}
    for (const reminder of reminders) {
      if (reminder.done) continue
      ;(result[reminder.date] ??= []).push(categoryColor[reminder.category])
    }
    return result
  }, [reminders])

  const quickAdd = (event: FormEvent) => {
    event.preventDefault()
    const title = quickTitle.trim()
    if (!title) return
    createReminder({ title, note: '', date: day ?? today, priority: 'medium', category: 'personal', time: undefined, groupId: undefined })
    setQuickTitle('')
    notify.success("Eslatma qo'shildi", `${title} — ${formatDateWithWeekday(day ?? today)}`)
  }

  const clearDone = () => {
    runWithUndo('Bajarilganlar tozalandi', () => {
      clearCompletedReminders()
    })
  }

  const hasFilters = category !== 'all' || priority !== 'all' || day !== null || query !== ''

  return (
    <div className="animate-fade-in grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <PageHeader
          title="Eslatmalar"
          description="Muhim ishlar, yig'ilishlar va darsga oid eslatmalar"
          actions={
            <Button icon={Plus} size="lg" onClick={() => openModal({ type: 'reminder-form', date: day ?? undefined })}>
              Yangi eslatma
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
          <MetricCard label="Bugungi" value={stats.today} icon={BellRing} color="blue" hint="Bajarilishi kerak" onClick={() => setDay(today)} />
          <MetricCard label="Muddati o'tgan" value={stats.overdue} icon={TriangleAlert} color="rose" hint="E'tibor bering" />
          <MetricCard label="Kelgusi 7 kun" value={stats.week} icon={CalendarRange} color="violet" hint="Rejalashtirilgan" />
          <MetricCard label="Bajarilgan" value={stats.done} icon={CircleCheckBig} color="green" hint="Barcha vaqt davomida" onClick={() => setShowDone(true)} />
        </div>

        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <FilterPills<CategoryFilter>
              size="sm"
              label="Turkum"
              value={category}
              onChange={setCategory}
              items={[
                { value: 'all', label: 'Barchasi' },
                ...(Object.keys(reminderCategoryLabel) as ReminderCategory[]).map((value) => ({ value, label: reminderCategoryLabel[value] })),
              ]}
            />
            <div className="grid gap-2 sm:grid-cols-2 2xl:w-[400px]">
              <SearchInput size="sm" value={query} onChange={setQuery} placeholder="Eslatma qidirish..." aria-label="Eslatma qidirish" />
              <Select<PriorityFilter>
                size="sm"
                value={priority}
                onChange={setPriority}
                aria-label="Muhimlik"
                options={[
                  { value: 'all', label: 'Barcha darajalar' },
                  ...(Object.keys(reminderPriorityLabel) as ReminderPriority[]).map((value) => ({ value, label: `${reminderPriorityLabel[value]} muhimlik` })),
                ]}
              />
            </div>
          </div>

          {day ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
              <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{formatDateWithWeekday(day)} kungi eslatmalar</span>
              <button type="button" onClick={() => setDay(null)} className="rounded-md p-1 hover:bg-blue-100 dark:hover:bg-blue-500/20" aria-label="Sana filtrini olib tashlash">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <form onSubmit={quickAdd} className="mt-4 flex gap-2">
            <TextInput
              value={quickTitle}
              onChange={(event) => setQuickTitle(event.target.value)}
              placeholder={`Tezkor eslatma (${day ? formatDateWithWeekday(day) : 'bugun'}) — yozing va Enter bosing`}
              aria-label="Tezkor eslatma"
              maxLength={120}
            />
            <Button type="submit" variant="soft" icon={BellPlus} disabled={!quickTitle.trim()}>
              <span className="hidden sm:inline">Qo'shish</span>
            </Button>
          </form>

          <div className="mt-5 space-y-6">
            {sections.length === 0 && done.length === 0 ? (
              <EmptyState
                icon={BellRing}
                title={hasFilters ? 'Eslatma topilmadi' : "Eslatma yo'q"}
                message={hasFilters ? "Filtrlarni o'zgartirib ko'ring." : "Muhim ishlarni unutmaslik uchun eslatma qo'shing."}
                action={
                  hasFilters ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setCategory('all')
                        setPriority('all')
                        setDay(null)
                        setQuery('')
                      }}
                    >
                      Filtrlarni tozalash
                    </Button>
                  ) : undefined
                }
              />
            ) : null}
            {sections.length === 0 && done.length > 0 ? (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Barcha eslatmalar bajarilgan. Ajoyib!
              </p>
            ) : null}
            {sections.map((section) => (
              <section key={section.id} aria-label={section.title}>
                <h2 className={cn('mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide', section.tone)}>
                  {section.title}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">{section.items.length}</span>
                </h2>
                <ul className="space-y-2">
                  {section.items.map((reminder) => (
                    <ReminderItem key={reminder.id} reminder={reminder} group={reminder.groupId ? groupMap.get(reminder.groupId) : undefined} today={today} nowTime={nowTime} />
                  ))}
                </ul>
              </section>
            ))}

            {done.length > 0 ? (
              <section aria-label="Bajarilganlar">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDone((v) => !v)}
                    aria-expanded={showDone}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
                  >
                    <ChevronDown className={cn('h-4 w-4 transition-transform', !showDone && '-rotate-90')} aria-hidden="true" />
                    Bajarilganlar
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] dark:bg-emerald-500/10">{done.length}</span>
                  </button>
                  <Button size="xs" variant="ghost" icon={Eraser} onClick={clearDone}>
                    Tozalash
                  </Button>
                </div>
                {showDone ? (
                  <ul className="space-y-2">
                    {done.map((reminder) => (
                      <ReminderItem key={reminder.id} reminder={reminder} group={reminder.groupId ? groupMap.get(reminder.groupId) : undefined} today={today} nowTime={nowTime} />
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}
          </div>
        </Card>
      </div>

      <aside ref={railRef} className="space-y-6 xl:sticky-rail" aria-label="Eslatmalar taqvimi">
        <Card className="p-5">
          <PanelHeader title="Taqvim" icon={CalendarCheck2} subtitle="Kunni tanlang — shu kun eslatmalari chiqadi" />
          <MiniCalendar
            className="mt-4"
            month={month}
            onMonthChange={setMonth}
            selected={day}
            onSelect={(value) => setDay(value === day ? null : value)}
            today={today}
            markers={markers}
          />
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {(Object.keys(reminderCategoryLabel) as ReminderCategory[]).map((value) => (
              <span key={value} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className={cn('h-2 w-2 rounded-full', accent[categoryColor[value]].solidBg)} aria-hidden="true" />
                {reminderCategoryLabel[value]}
              </span>
            ))}
          </div>
          <Button className="mt-4" fullWidth variant="secondary" icon={Plus} onClick={() => openModal({ type: 'reminder-form', date: day ?? today })}>
            {day ? `${formatDateWithWeekday(day).split(',')[0]} uchun eslatma` : 'Bugun uchun eslatma'}
          </Button>
        </Card>
      </aside>
    </div>
  )
}
