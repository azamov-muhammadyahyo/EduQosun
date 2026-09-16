import { useMemo, useState } from 'react'
import { CalendarPlus, TriangleAlert } from 'lucide-react'
import type { DateKey, LessonKind } from '../../types'
import { lessonDurations, lessonKindLabel } from '../../data/catalog'
import { formatDateWithWeekday, formatDuration, fromMinutes, toMinutes, todayKey } from '../../lib/date'
import { extraLessonKey, lessonDuration, lessonsOnDate } from '../../domain/lessons'
import { findLessonConflicts } from '../../domain/schedule'
import { useGroupMap, useLesson, useLessonSources, useSettings } from '../../hooks/useData'
import { useGroupOptions } from '../../hooks/useOptions'
import { createExtraLesson, updateLesson } from '../../store/actions/lessons'
import { notify, toast } from '../../store/toastStore'
import { openDrawer } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Field, Select, TextArea, TextInput } from '../ui/Form'
import { Modal } from '../ui/Modal'

interface LessonForm {
  groupId: string
  date: DateKey
  start: string
  end: string
  topic: string
  kind: LessonKind
  room: string
  homework: string
  notes: string
}

interface LessonFormModalProps {
  lessonKey?: string
  groupId?: string
  date?: DateKey
  onClose: () => void
}

/** Jadvaldan tashqari dars qo'shish yoki mavjud darsni tahrirlash */
export function LessonFormModal({ lessonKey, groupId, date, onClose }: LessonFormModalProps) {
  const lesson = useLesson(lessonKey ?? null)
  const sources = useLessonSources()
  const groups = useGroupMap()
  const settings = useSettings()
  const groupOptions = useGroupOptions()
  const editing = lesson !== null

  const [form, setForm] = useState<LessonForm>(() => {
    if (lesson) {
      return {
        groupId: lesson.groupId,
        date: lesson.date,
        start: lesson.start,
        end: lesson.end,
        topic: lesson.topic,
        kind: lesson.kind,
        room: lesson.room,
        homework: lesson.homework,
        notes: lesson.notes,
      }
    }
    const initialGroup = groups.get(groupId ?? '') ?? groups.get(groupOptions[0]?.value ?? '')
    const start = '14:00'
    return {
      groupId: initialGroup?.id ?? '',
      date: date ?? todayKey(),
      start,
      end: fromMinutes(toMinutes(start) + settings.defaultLessonMinutes),
      topic: '',
      kind: 'mixed',
      room: initialGroup?.room ?? '',
      homework: '',
      notes: '',
    }
  })
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof LessonForm>(key: K, value: LessonForm[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const errors = useMemo(() => {
    const result: Partial<Record<keyof LessonForm, string>> = {}
    if (!form.groupId) result.groupId = 'Guruhni tanlang'
    if (!form.date) result.date = 'Sanani tanlang'
    if (!form.start) result.start = 'Vaqtni kiriting'
    if (!form.end || toMinutes(form.end) <= toMinutes(form.start)) result.end = "Tugash vaqti boshlanishdan keyin bo'lsin"
    if (!form.topic.trim()) result.topic = 'Mavzuni kiriting'
    return result
  }, [form])
  const shown = submitted ? errors : {}

  const conflicts = useMemo(() => {
    if (!form.date || !form.start || !form.end) return []
    return findLessonConflicts(
      lessonsOnDate(form.date, sources),
      form.start,
      form.end,
      (id) => groups.get(id)?.name ?? '',
      lessonKey,
    )
  }, [form.date, form.start, form.end, sources, groups, lessonKey])

  const duration = lessonDuration({ start: form.start || '00:00', end: form.end || '00:00' })

  const changeStart = (start: string) => {
    if (!start) return
    const keep = Math.max(15, duration || settings.defaultLessonMinutes)
    setForm((prev) => ({ ...prev, start, end: fromMinutes(toMinutes(start) + keep) }))
  }

  const changeGroup = (id: string) => {
    const group = groups.get(id)
    setForm((prev) => ({ ...prev, groupId: id, room: prev.room || group?.room || '' }))
  }

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      notify.error("Formani to'ldiring", "Qizil bilan belgilangan maydonlarni tekshiring.")
      return
    }
    if (lesson) {
      updateLesson(lesson.key, {
        topic: form.topic.trim(),
        start: form.start,
        end: form.end,
        room: form.room.trim(),
        homework: form.homework.trim(),
        notes: form.notes.trim(),
      })
      notify.success('Dars yangilandi', `${groups.get(lesson.groupId)?.name ?? ''} · ${form.start}–${form.end}`)
    } else {
      const created = createExtraLesson({
        groupId: form.groupId,
        date: form.date,
        start: form.start,
        end: form.end,
        topic: form.topic.trim(),
        kind: form.kind,
        room: form.room.trim(),
        homework: form.homework.trim(),
        notes: form.notes.trim(),
      })
      toast({
        title: "Dars jadvalga qo'shildi",
        description: `${groups.get(created.groupId)?.name ?? ''} · ${formatDateWithWeekday(created.date)}, ${created.start}`,
        actionLabel: 'Batafsil',
        onAction: () => openDrawer({ type: 'lesson', lessonKey: extraLessonKey(created.id) }),
      })
    }
    onClose()
  }

  const group = groups.get(form.groupId)

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Darsni tahrirlash' : 'Dars jadvalini tuzish'}
      description={
        editing && group
          ? `${group.name} · ${formatDateWithWeekday(form.date)}`
          : "Jadvaldan tashqari (qo'shimcha) dars vaqti va mavzusini belgilang"
      }
      icon={CalendarPlus}
      iconColor="violet"
      size="lg"
      persistent
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit">{editing ? 'Saqlash' : "Darsni qo'shish"}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guruh" required error={shown.groupId}>
          {(id) => (
            <Select
              id={id}
              value={form.groupId}
              onChange={changeGroup}
              options={editing && group ? [{ value: group.id, label: `${group.name} · ${group.course}` }] : groupOptions}
              disabled={editing}
              invalid={!!shown.groupId}
            />
          )}
        </Field>
        <Field label="Sana" required error={shown.date}>
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={form.date}
              disabled={editing}
              invalid={!!shown.date}
              onChange={(event) => set('date', event.target.value)}
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Boshlanish" required error={shown.start}>
            {(id) => (
              <TextInput id={id} type="time" value={form.start} invalid={!!shown.start} onChange={(event) => changeStart(event.target.value)} />
            )}
          </Field>
          <Field label="Tugash" required error={shown.end}>
            {(id) => (
              <TextInput id={id} type="time" value={form.end} invalid={!!shown.end} onChange={(event) => set('end', event.target.value)} />
            )}
          </Field>
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-200">Davomiylik</p>
          <div className="flex flex-wrap gap-1.5">
            {lessonDurations.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => set('end', fromMinutes(toMinutes(form.start) + minutes))}
                className={
                  duration === minutes
                    ? 'h-10 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white'
                    : 'h-10 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50'
                }
              >
                {minutes} daq
              </button>
            ))}
          </div>
          {duration > 0 ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDuration(duration)}</p> : null}
        </div>
        <Field label="Mavzu" required error={shown.topic} className="sm:col-span-2">
          {(id) => (
            <TextInput
              id={id}
              data-autofocus
              value={form.topic}
              maxLength={100}
              invalid={!!shown.topic}
              onChange={(event) => set('topic', event.target.value)}
              placeholder="Masalan: Array metodlari — amaliy mashg'ulot"
            />
          )}
        </Field>
        <Field label="Dars turi">
          {(id) => (
            <Select
              id={id}
              value={form.kind}
              disabled={editing}
              onChange={(value) => set('kind', value)}
              options={(Object.keys(lessonKindLabel) as LessonKind[]).map((kind) => ({ value: kind, label: lessonKindLabel[kind] }))}
            />
          )}
        </Field>
        <Field label="Xona">
          {(id) => <TextInput id={id} value={form.room} maxLength={40} onChange={(event) => set('room', event.target.value)} />}
        </Field>
        <Field label="Uy vazifasi" className="sm:col-span-2">
          {(id) => (
            <TextArea
              id={id}
              rows={2}
              value={form.homework}
              maxLength={400}
              onChange={(event) => set('homework', event.target.value)}
              placeholder="Darsdan keyingi uy vazifasi"
            />
          )}
        </Field>
        <Field label="Izoh" className="sm:col-span-2" hint="Faqat sizga ko'rinadi">
          {(id) => (
            <TextArea
              id={id}
              rows={2}
              value={form.notes}
              maxLength={400}
              onChange={(event) => set('notes', event.target.value)}
              placeholder="Dars rejasi, kerakli materiallar..."
            />
          )}
        </Field>
      </div>

      {conflicts.length > 0 ? (
        <div className="mt-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Diqqat: vaqt to'qnashuvi</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {conflicts.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
