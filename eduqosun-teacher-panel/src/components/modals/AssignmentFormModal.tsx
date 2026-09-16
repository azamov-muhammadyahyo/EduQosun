import { useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { addDays, formatRelativeDay, todayKey } from '../../lib/date'
import { useGroupOptions } from '../../hooks/useOptions'
import { useApp } from '../../store/appStore'
import { createAssignment, updateAssignment, type AssignmentInput } from '../../store/actions/assignments'
import { notify, toast } from '../../store/toastStore'
import { openDrawer } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Checkbox, Field, Select, TextArea, TextInput } from '../ui/Form'
import { Modal } from '../ui/Modal'

const scoreOptions = [
  { value: '5', label: '5 ball' },
  { value: '10', label: '10 ball' },
  { value: '20', label: '20 ball' },
  { value: '100', label: '100 ball' },
]

export function AssignmentFormModal({
  assignmentId,
  groupId,
  onClose,
}: {
  assignmentId?: string
  groupId?: string
  onClose: () => void
}) {
  const existing = useApp((s) => (assignmentId ? s.assignments.find((a) => a.id === assignmentId) : undefined))
  const groupOptions = useGroupOptions()
  const today = todayKey()
  const [form, setForm] = useState<AssignmentInput>(() =>
    existing
      ? {
          groupId: existing.groupId,
          title: existing.title,
          description: existing.description,
          dueDate: existing.dueDate,
          dueTime: existing.dueTime,
          maxScore: existing.maxScore,
        }
      : {
          groupId: groupId ?? groupOptions[0]?.value ?? '',
          title: '',
          description: '',
          dueDate: addDays(today, 3),
          dueTime: '23:59',
          maxScore: 10,
        },
  )
  const [announce, setAnnounce] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo(() => {
    const result: Partial<Record<keyof AssignmentInput, string>> = {}
    if (!form.groupId) result.groupId = 'Guruhni tanlang'
    if (!form.title.trim()) result.title = 'Topshiriq nomini kiriting'
    if (!form.dueDate) result.dueDate = 'Muddatni tanlang'
    else if (!existing && form.dueDate < today) result.dueDate = "Muddat o'tib ketgan sana bo'lmasin"
    if (!form.dueTime) result.dueTime = 'Vaqtni kiriting'
    return result
  }, [form, existing, today])
  const shown = submitted ? errors : {}

  const set = <K extends keyof AssignmentInput>(key: K, value: AssignmentInput[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      notify.error("Formani to'ldiring", "Qizil bilan belgilangan maydonlarni tekshiring.")
      return
    }
    if (existing) {
      updateAssignment(existing.id, { ...form, title: form.title.trim(), description: form.description.trim() })
      notify.success('Topshiriq yangilandi', form.title.trim())
    } else {
      const created = createAssignment(form, { announce })
      toast({
        title: 'Topshiriq berildi',
        description: announce ? "Guruh chatiga e'lon yuborildi." : created.title,
        actionLabel: 'Ochish',
        onAction: () => openDrawer({ type: 'assignment-review', assignmentId: created.id }),
      })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Topshiriqni tahrirlash' : 'Topshiriq berish'}
      description="O'quvchilarga vazifa yuklang va topshirish muddatini belgilang"
      icon={ClipboardList}
      iconColor="amber"
      size="lg"
      persistent
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit">{existing ? 'Saqlash' : 'Topshiriq berish'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guruh" required error={shown.groupId}>
          {(id) => (
            <Select
              id={id}
              value={form.groupId}
              onChange={(value) => set('groupId', value)}
              options={groupOptions}
              disabled={!!existing}
              invalid={!!shown.groupId}
            />
          )}
        </Field>
        <Field label="Maksimal ball">
          {(id) => (
            <Select
              id={id}
              value={String(form.maxScore)}
              onChange={(value) => set('maxScore', Number(value))}
              options={scoreOptions.some((o) => o.value === String(form.maxScore)) ? scoreOptions : [...scoreOptions, { value: String(form.maxScore), label: `${form.maxScore} ball` }]}
            />
          )}
        </Field>
        <Field label="Topshiriq nomi" required error={shown.title} className="sm:col-span-2">
          {(id) => (
            <TextInput
              id={id}
              data-autofocus
              value={form.title}
              maxLength={100}
              invalid={!!shown.title}
              onChange={(event) => set('title', event.target.value)}
              placeholder="Masalan: Array metodlari bo'yicha 10 ta masala"
            />
          )}
        </Field>
        <Field label="Tavsif" className="sm:col-span-2">
          {(id) => (
            <TextArea
              id={id}
              rows={4}
              value={form.description}
              maxLength={1000}
              onChange={(event) => set('description', event.target.value)}
              placeholder="Talablar, baholash mezonlari va foydali havolalar"
            />
          )}
        </Field>
        <Field
          label="Topshirish muddati"
          required
          error={shown.dueDate}
          hint={form.dueDate ? formatRelativeDay(form.dueDate, today) : undefined}
        >
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={form.dueDate}
              min={existing ? undefined : today}
              invalid={!!shown.dueDate}
              onChange={(event) => set('dueDate', event.target.value)}
            />
          )}
        </Field>
        <Field label="Soat" required error={shown.dueTime}>
          {(id) => (
            <TextInput id={id} type="time" value={form.dueTime} invalid={!!shown.dueTime} onChange={(event) => set('dueTime', event.target.value)} />
          )}
        </Field>
        <div className="flex flex-wrap gap-1.5 sm:col-span-2">
          {[1, 2, 3, 7].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => set('dueDate', addDays(today, days))}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-500/10"
            >
              {days === 1 ? 'Ertaga' : days === 7 ? '1 haftadan keyin' : `${days} kundan keyin`}
            </button>
          ))}
        </div>
        {!existing ? (
          <Checkbox
            className="sm:col-span-2"
            checked={announce}
            onChange={setAnnounce}
            label="Guruh chatiga e'lon qilish"
            description="O'quvchilar topshiriq va muddat haqida xabar oladi"
          />
        ) : null}
      </div>
    </Modal>
  )
}
