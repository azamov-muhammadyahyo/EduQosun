import { Check, Plus, Trash2 } from 'lucide-react'
import type { AccentColor, GroupIconKey, LessonKind, ScheduleSlot, Weekday } from '../../types'
import { groupIconKeys, groupIconLabel, lessonKindLabel } from '../../data/catalog'
import { accent, accentPalette } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { WEEKDAYS, WEEKDAYS_SHORT, fromMinutes, toMinutes } from '../../lib/date'
import { GroupGlyph } from '../ui/GroupIcon'

/* ———————————— Rang tanlash ———————————— */

export function ColorPicker({ value, onChange }: { value: AccentColor; onChange: (color: AccentColor) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rang">
      {accentPalette.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform hover:scale-110',
            accent[color].gradient,
            value === color && cn('ring-2 ring-offset-2 dark:ring-offset-slate-800', accent[color].ring),
          )}
        >
          {value === color ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
        </button>
      ))}
    </div>
  )
}

/* ———————————— Ikonka tanlash ———————————— */

export function IconPicker({
  value,
  onChange,
  color,
}: {
  value: GroupIconKey
  onChange: (icon: GroupIconKey) => void
  color: AccentColor
}) {
  return (
    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Ikonka">
      {groupIconKeys.map((icon) => {
        const selected = value === icon
        return (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={selected}
            title={groupIconLabel[icon]}
            aria-label={groupIconLabel[icon]}
            onClick={() => onChange(icon)}
            className={cn(
              'inline-flex h-11 items-center justify-center rounded-xl border transition-colors',
              selected
                ? cn('border-transparent text-white shadow-sm', accent[color].gradient)
                : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50',
            )}
          >
            <GroupGlyph icon={icon} className="h-5 w-5" />
          </button>
        )
      })}
    </div>
  )
}

/* ———————————— Haftalik jadval ———————————— */

const WEEKDAY_LIST: Weekday[] = [1, 2, 3, 4, 5, 6, 7]

const inputClass =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100'

interface SchedulePickerProps {
  value: ScheduleSlot[]
  onChange: (slots: ScheduleSlot[]) => void
  defaultMinutes: number
  invalid?: boolean
}

/**
 * Hafta kunlarini tanlash va har bir kun uchun vaqt/tur kiritish.
 * Kun tugmasi bosilganda — oxirgi kiritilgan vaqt bilan qator qo'shiladi.
 */
export function SchedulePicker({ value, onChange, defaultMinutes, invalid }: SchedulePickerProps) {
  const activeDays = new Set(value.map((slot) => slot.day))
  const template = value[value.length - 1]

  const toggleDay = (day: Weekday) => {
    if (activeDays.has(day)) {
      onChange(value.filter((slot) => slot.day !== day))
      return
    }
    const start = template?.start ?? '14:00'
    const end = template?.end ?? fromMinutes(toMinutes(start) + defaultMinutes)
    onChange([...value, { day, start, end, kind: template?.kind ?? 'mixed' }].sort((a, b) => a.day - b.day))
  }

  const update = (index: number, patch: Partial<ScheduleSlot>) => {
    onChange(
      value.map((slot, i) => {
        if (i !== index) return slot
        const next = { ...slot, ...patch }
        // Boshlanish o'zgarsa, davomiylik saqlanadi
        if (patch.start && !patch.end) {
          const duration = Math.max(15, toMinutes(slot.end) - toMinutes(slot.start))
          next.end = fromMinutes(toMinutes(patch.start) + duration)
        }
        return next
      }),
    )
  }

  const duplicateSlot = (index: number) => {
    const slot = value[index]
    const start = fromMinutes(toMinutes(slot.end) + 10)
    const duration = toMinutes(slot.end) - toMinutes(slot.start)
    const copy = { ...slot, start, end: fromMinutes(toMinutes(start) + duration) }
    onChange([...value.slice(0, index + 1), copy, ...value.slice(index + 1)])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Dars kunlari">
        {WEEKDAY_LIST.map((day) => {
          const on = activeDays.has(day)
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              title={WEEKDAYS[day - 1]}
              onClick={() => toggleDay(day)}
              className={cn(
                'h-9 min-w-11 rounded-lg border px-2.5 text-sm font-semibold transition-colors',
                on
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                  : invalid
                    ? 'border-rose-300 text-slate-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-slate-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50',
              )}
            >
              {WEEKDAYS_SHORT[day - 1]}
            </button>
          )
        })}
      </div>

      {value.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/30">
          {value.map((slot, index) => {
            const wrongTime = toMinutes(slot.end) <= toMinutes(slot.start)
            return (
              <div key={`${slot.day}-${index}`} className="grid grid-cols-[88px_1fr_1fr] items-center gap-2 sm:grid-cols-[96px_110px_110px_1fr_auto]">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{WEEKDAYS[slot.day - 1]}</span>
                <input
                  type="time"
                  value={slot.start}
                  onChange={(event) => event.target.value && update(index, { start: event.target.value })}
                  className={inputClass}
                  aria-label={`${WEEKDAYS[slot.day - 1]} — boshlanish`}
                />
                <input
                  type="time"
                  value={slot.end}
                  onChange={(event) => event.target.value && update(index, { end: event.target.value })}
                  className={cn(inputClass, wrongTime && 'border-rose-400 dark:border-rose-500/60')}
                  aria-label={`${WEEKDAYS[slot.day - 1]} — tugash`}
                  aria-invalid={wrongTime || undefined}
                />
                <select
                  value={slot.kind}
                  onChange={(event) => update(index, { kind: event.target.value as LessonKind })}
                  className={cn(inputClass, 'col-span-2 sm:col-span-1')}
                  aria-label="Dars turi"
                >
                  {(Object.keys(lessonKindLabel) as LessonKind[]).map((kind) => (
                    <option key={kind} value={kind}>
                      {lessonKindLabel[kind]}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => duplicateSlot(index)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-blue-600 dark:hover:bg-slate-800"
                    aria-label="Shu kunga yana dars qo'shish"
                    title="Shu kunga yana dars qo'shish"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-rose-600 dark:hover:bg-slate-800"
                    aria-label="Darsni olib tashlash"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
