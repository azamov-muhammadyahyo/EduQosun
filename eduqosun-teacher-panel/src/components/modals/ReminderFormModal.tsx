import { useState } from 'react'
import { BellPlus, BellRing } from 'lucide-react'
import type { DateKey, ReminderCategory, ReminderPriority } from '../../types'
import { reminderCategoryLabel, reminderPriorityLabel } from '../../data/catalog'
import { addDays, formatRelativeDay, todayKey } from '../../lib/date'
import { useGroupOptions } from '../../hooks/useOptions'
import { useApp } from '../../store/appStore'
import { createReminder, updateReminder, type ReminderInput } from '../../store/actions/reminders'
import { notify } from '../../store/toastStore'
import { Button } from '../ui/Button'
import { Field, Select, TextArea, TextInput } from '../ui/Form'
import { Modal } from '../ui/Modal'
import { SegmentedControl } from '../ui/Tabs'

export function ReminderFormModal({ reminderId, date, onClose }: { reminderId?: string; date?: DateKey; onClose: () => void }) {
  const existing = useApp((s) => (reminderId ? s.reminders.find((r) => r.id === reminderId) : undefined))
  const groupOptions = useGroupOptions({ allLabel: "Guruhga bog'lanmagan" })
  const today = todayKey()
  const [form, setForm] = useState<ReminderInput>(() =>
    existing
      ? {
          title: existing.title,
          note: existing.note,
          date: existing.date,
          time: existing.time,
          priority: existing.priority,
          category: existing.category,
          groupId: existing.groupId,
        }
      : { title: '', note: '', date: date ?? today, time: '', priority: 'medium', category: 'personal', groupId: undefined },
  )
  const [submitted, setSubmitted] = useState(false)
  const titleError = submitted && !form.title.trim() ? 'Eslatma nomini kiriting' : undefined
  const dateError = submitted && !form.date ? 'Sanani tanlang' : undefined

  const set = <K extends keyof ReminderInput>(key: K, value: ReminderInput[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = () => {
    setSubmitted(true)
    if (!form.title.trim() || !form.date) {
      notify.error("Formani to'ldiring", 'Eslatma nomi va sanasi majburiy.')
      return
    }
    const input: ReminderInput = { ...form, time: form.time || undefined, groupId: form.groupId || undefined }
    if (existing) {
      updateReminder(existing.id, input)
      notify.success('Eslatma yangilandi', input.title.trim())
    } else {
      createReminder(input)
      notify.success("Eslatma qo'shildi", `${formatRelativeDay(input.date, today)}${input.time ? `, ${input.time}` : ''} — ${input.title.trim()}`)
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Eslatmani tahrirlash' : 'Yangi eslatma'}
      description="Muhim ishlarni unutmaslik uchun eslatma qo'shing"
      icon={existing ? BellRing : BellPlus}
      iconColor="amber"
      size="md"
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit">{existing ? 'Saqlash' : "Qo'shish"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nima qilish kerak?" required error={titleError}>
          {(id) => (
            <TextInput
              id={id}
              data-autofocus
              value={form.title}
              maxLength={120}
              invalid={!!titleError}
              onChange={(event) => set('title', event.target.value)}
              placeholder="Masalan: Nazorat ishi savollarini tayyorlash"
            />
          )}
        </Field>
        <Field label="Izoh">
          {(id) => (
            <TextArea id={id} rows={2} value={form.note} maxLength={500} onChange={(event) => set('note', event.target.value)} />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sana" required error={dateError}>
            {(id) => (
              <TextInput id={id} type="date" value={form.date} invalid={!!dateError} onChange={(event) => set('date', event.target.value)} />
            )}
          </Field>
          <Field label="Vaqt" hint="Ixtiyoriy">
            {(id) => <TextInput id={id} type="time" value={form.time ?? ''} onChange={(event) => set('time', event.target.value)} />}
          </Field>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 7].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => set('date', addDays(today, days))}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-amber-500/10"
            >
              {days === 0 ? 'Bugun' : days === 1 ? 'Ertaga' : days === 7 ? 'Keyingi hafta' : 'Indinga'}
            </button>
          ))}
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-200">Muhimlik darajasi</p>
          <SegmentedControl<ReminderPriority>
            label="Muhimlik"
            fullWidth
            items={(['high', 'medium', 'low'] as ReminderPriority[]).map((p) => ({ value: p, label: reminderPriorityLabel[p] }))}
            value={form.priority}
            onChange={(priority) => set('priority', priority)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Toifa">
            {(id) => (
              <Select
                id={id}
                value={form.category}
                onChange={(category) => set('category', category)}
                options={(Object.keys(reminderCategoryLabel) as ReminderCategory[]).map((c) => ({ value: c, label: reminderCategoryLabel[c] }))}
              />
            )}
          </Field>
          <Field label="Guruh">
            {(id) => (
              <Select
                id={id}
                value={form.groupId ?? 'all'}
                onChange={(value) => set('groupId', value === 'all' ? undefined : value)}
                options={groupOptions}
              />
            )}
          </Field>
        </div>
      </div>
    </Modal>
  )
}
