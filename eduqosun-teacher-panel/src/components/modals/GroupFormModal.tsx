import { useMemo, useState } from 'react'
import { TriangleAlert, Users } from 'lucide-react'
import type { Group } from '../../types'
import { directions } from '../../data/catalog'
import { addMonths, fromMinutes, toMinutes, todayKey } from '../../lib/date'
import { findScheduleConflicts } from '../../domain/schedule'
import { useSettings } from '../../hooks/useData'
import { navigate } from '../../router'
import { useApp } from '../../store/appStore'
import { createGroup, updateGroup, type GroupInput } from '../../store/actions/groups'
import { notify, toast } from '../../store/toastStore'
import { ColorPicker, IconPicker, SchedulePicker } from '../forms/Pickers'
import { Button } from '../ui/Button'
import { Field, Select, TextArea, TextInput } from '../ui/Form'
import { GroupTile } from '../ui/GroupIcon'
import { Modal } from '../ui/Modal'

type Errors = Partial<Record<keyof GroupInput, string>>

function fromGroup(group: Group): GroupInput {
  const { name, course, direction, subject, tagline, description, color, icon, room, startDate, endDate, schedule } = group
  return { name, course, direction, subject, tagline, description, color, icon, room, startDate, endDate, schedule }
}

function emptyForm(lessonMinutes: number): GroupInput {
  const start = '14:00'
  const end = fromMinutes(toMinutes(start) + lessonMinutes)
  const today = todayKey()
  return {
    name: '',
    course: '',
    direction: directions[0],
    subject: '',
    tagline: '',
    description: '',
    color: 'blue',
    icon: 'code',
    room: '',
    startDate: today,
    endDate: addMonths(today, 6),
    schedule: [1, 3, 5].map((day) => ({ day: day as 1 | 3 | 5, start, end, kind: 'mixed' as const })),
  }
}

function validate(form: GroupInput): Errors {
  const errors: Errors = {}
  if (!form.name.trim()) errors.name = 'Guruh nomini kiriting'
  if (!form.course.trim()) errors.course = 'Kurs nomini kiriting'
  if (!form.subject.trim()) errors.subject = 'Fan nomini kiriting'
  if (!form.startDate) errors.startDate = 'Boshlanish sanasini tanlang'
  if (form.endDate && form.startDate && form.endDate <= form.startDate) {
    errors.endDate = "Tugash sanasi boshlanishdan keyin bo'lishi kerak"
  }
  if (form.schedule.length === 0) errors.schedule = 'Kamida bitta dars kunini tanlang'
  else if (form.schedule.some((slot) => toMinutes(slot.end) <= toMinutes(slot.start))) {
    errors.schedule = "Dars tugash vaqti boshlanishdan keyin bo'lishi kerak"
  }
  return errors
}

export function GroupFormModal({ groupId, onClose }: { groupId?: string; onClose: () => void }) {
  const groups = useApp((s) => s.groups)
  const settings = useSettings()
  const existing = groupId ? groups.find((g) => g.id === groupId) : undefined
  const [form, setForm] = useState<GroupInput>(() =>
    existing ? fromGroup(existing) : emptyForm(settings.defaultLessonMinutes),
  )
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo(() => validate(form), [form])
  const shownErrors = submitted ? errors : {}
  const conflicts = useMemo(() => findScheduleConflicts(form.schedule, groups, groupId), [form.schedule, groups, groupId])
  const duplicateName = groups.some(
    (g) => g.id !== groupId && g.status === 'active' && g.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
  )

  const set = <K extends keyof GroupInput>(key: K, value: GroupInput[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      notify.error("Formani to'ldiring", "Qizil bilan belgilangan maydonlarni tekshiring.")
      return
    }
    const clean: GroupInput = {
      ...form,
      name: form.name.trim(),
      course: form.course.trim(),
      subject: form.subject.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      room: form.room.trim(),
      endDate: form.endDate || undefined,
    }
    if (existing) {
      updateGroup(existing.id, clean)
      notify.success('Guruh yangilandi', `${clean.name} · ${clean.course}`)
    } else {
      const created = createGroup(clean)
      toast({
        title: 'Yangi guruh yaratildi',
        description: `${created.name} · ${created.course} (${created.code})`,
        actionLabel: "Ko'rish",
        onAction: () => navigate(`groups/${created.id}`),
      })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Guruhni tahrirlash' : 'Yangi guruh yaratish'}
      description={existing ? `${existing.name} · ${existing.code}` : "Guruh ma'lumotlari va haftalik dars jadvalini kiriting"}
      icon={Users}
      size="lg"
      persistent
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit">{existing ? 'Saqlash' : 'Guruh yaratish'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Jonli ko'rinish */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/30">
          <GroupTile icon={form.icon} color={form.color} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {form.course.trim() || 'Kurs nomi'} <span className="font-normal text-slate-400">·</span>{' '}
              {form.name.trim() || 'Guruh'}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {form.direction} · {form.subject.trim() || 'Fan'} · haftasiga {form.schedule.length} ta dars
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Guruh nomi"
            required
            error={shownErrors.name}
            hint={duplicateName ? "Diqqat: shu nomli faol guruh allaqachon bor" : 'Masalan: 11-A'}
          >
            {(id) => (
              <TextInput
                id={id}
                data-autofocus
                value={form.name}
                maxLength={24}
                invalid={!!shownErrors.name}
                onChange={(event) => set('name', event.target.value)}
                placeholder="11-A"
              />
            )}
          </Field>
          <Field label="Kurs nomi" required error={shownErrors.course}>
            {(id) => (
              <TextInput
                id={id}
                value={form.course}
                maxLength={48}
                invalid={!!shownErrors.course}
                onChange={(event) => set('course', event.target.value)}
                placeholder="Frontend Foundation"
              />
            )}
          </Field>
          <Field label="Yo'nalish">
            {(id) => (
              <Select
                id={id}
                value={form.direction}
                onChange={(value) => set('direction', value)}
                options={directions.map((d) => ({ value: d, label: d }))}
              />
            )}
          </Field>
          <Field label="Fan" required error={shownErrors.subject}>
            {(id) => (
              <TextInput
                id={id}
                value={form.subject}
                maxLength={40}
                invalid={!!shownErrors.subject}
                onChange={(event) => set('subject', event.target.value)}
                placeholder="JavaScript"
              />
            )}
          </Field>
          <Field label="Boshlanish sanasi" required error={shownErrors.startDate}>
            {(id) => (
              <TextInput
                id={id}
                type="date"
                value={form.startDate}
                invalid={!!shownErrors.startDate}
                onChange={(event) => set('startDate', event.target.value)}
              />
            )}
          </Field>
          <Field label="Tugash sanasi" error={shownErrors.endDate} hint="Ixtiyoriy">
            {(id) => (
              <TextInput
                id={id}
                type="date"
                value={form.endDate ?? ''}
                min={form.startDate}
                invalid={!!shownErrors.endDate}
                onChange={(event) => set('endDate', event.target.value || undefined)}
              />
            )}
          </Field>
          <Field label="Xona">
            {(id) => (
              <TextInput id={id} value={form.room} maxLength={40} onChange={(event) => set('room', event.target.value)} placeholder="201-xona" />
            )}
          </Field>
          <Field label="Qisqa tavsif">
            {(id) => (
              <TextInput
                id={id}
                value={form.tagline}
                maxLength={120}
                onChange={(event) => set('tagline', event.target.value)}
                placeholder="Guruh haqida bir jumla"
              />
            )}
          </Field>
        </div>

        <Field label="Guruh haqida">
          {(id) => (
            <TextArea
              id={id}
              rows={3}
              value={form.description}
              maxLength={600}
              onChange={(event) => set('description', event.target.value)}
              placeholder="Kurs maqsadi, o'rganiladigan mavzular va natijalar"
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[13px] font-medium text-slate-700 dark:text-slate-200">Rang</p>
            <ColorPicker value={form.color} onChange={(color) => set('color', color)} />
          </div>
          <div>
            <p className="mb-2 text-[13px] font-medium text-slate-700 dark:text-slate-200">Ikonka</p>
            <IconPicker value={form.icon} color={form.color} onChange={(icon) => set('icon', icon)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-slate-700 dark:text-slate-200">
            Haftalik dars jadvali <span className="text-rose-500">*</span>
          </p>
          <SchedulePicker
            value={form.schedule}
            onChange={(schedule) => set('schedule', schedule)}
            defaultMinutes={settings.defaultLessonMinutes}
            invalid={!!shownErrors.schedule}
          />
          {shownErrors.schedule ? (
            <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
              {shownErrors.schedule}
            </p>
          ) : null}
          {conflicts.length > 0 ? (
            <div className="mt-3 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Vaqt to'qnashuvi aniqlandi</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {conflicts.slice(0, 4).map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
