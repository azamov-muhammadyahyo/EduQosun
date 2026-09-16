import { useMemo, useState } from 'react'
import { ArrowRightLeft, UserPlus, UserRoundPen } from 'lucide-react'
import type { Gender, Student } from '../../types'
import { addDays, todayKey } from '../../lib/date'
import { isValidPhone } from '../../lib/format'
import { fullName } from '../../domain/students'
import { useGroupOptions } from '../../hooks/useOptions'
import { openDrawer } from '../../store/uiStore'
import { useApp } from '../../store/appStore'
import { createStudent, transferStudent, updateStudent, type StudentInput } from '../../store/actions/students'
import { notify, toast } from '../../store/toastStore'
import { Button } from '../ui/Button'
import { Field, Select, TextArea, TextInput } from '../ui/Form'
import { Modal } from '../ui/Modal'
import { SegmentedControl } from '../ui/Tabs'

type Errors = Partial<Record<keyof StudentInput, string>>

function fromStudent(student: Student): StudentInput {
  const { firstName, lastName, gender, groupId, phone, parentName, parentPhone, birthDate, joinedAt, note } = student
  return { firstName, lastName, gender, groupId, phone, parentName, parentPhone, birthDate, joinedAt, note }
}

function validate(form: StudentInput): Errors {
  const errors: Errors = {}
  if (!form.firstName.trim()) errors.firstName = 'Ismni kiriting'
  if (!form.lastName.trim()) errors.lastName = 'Familiyani kiriting'
  if (!form.groupId) errors.groupId = 'Guruhni tanlang'
  if (!isValidPhone(form.phone)) errors.phone = "Telefon raqami noto'g'ri (masalan: +998 90 123 45 67)"
  if (form.parentPhone && !isValidPhone(form.parentPhone)) errors.parentPhone = "Telefon raqami noto'g'ri"
  if (form.birthDate && form.birthDate >= todayKey()) errors.birthDate = "Tug'ilgan sana noto'g'ri"
  if (!form.joinedAt) errors.joinedAt = 'Sanani tanlang'
  return errors
}

export function StudentFormModal({
  studentId,
  groupId,
  onClose,
}: {
  studentId?: string
  groupId?: string
  onClose: () => void
}) {
  const students = useApp((s) => s.students)
  const groupOptions = useGroupOptions()
  const existing = studentId ? students.find((s) => s.id === studentId) : undefined
  const [form, setForm] = useState<StudentInput>(() =>
    existing
      ? fromStudent(existing)
      : {
          firstName: '',
          lastName: '',
          gender: 'male',
          groupId: groupId ?? groupOptions[0]?.value ?? '',
          phone: '+998 ',
          parentName: '',
          parentPhone: '',
          birthDate: addDays(todayKey(), -16 * 365),
          joinedAt: todayKey(),
          note: '',
        },
  )
  const [submitted, setSubmitted] = useState(false)
  const errors = useMemo(() => validate(form), [form])
  const shown = submitted ? errors : {}

  const duplicate = useMemo(() => {
    const first = form.firstName.trim().toLowerCase()
    const last = form.lastName.trim().toLowerCase()
    if (!first || !last) return false
    return students.some(
      (s) =>
        s.id !== studentId &&
        s.groupId === form.groupId &&
        s.status === 'active' &&
        s.firstName.toLowerCase() === first &&
        s.lastName.toLowerCase() === last,
    )
  }, [form.firstName, form.lastName, form.groupId, students, studentId])

  const set = <K extends keyof StudentInput>(key: K, value: StudentInput[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      notify.error("Formani to'ldiring", "Qizil bilan belgilangan maydonlarni tekshiring.")
      return
    }
    if (existing) {
      updateStudent(existing.id, form)
      notify.success("O'quvchi ma'lumotlari yangilandi", `${form.firstName} ${form.lastName}`)
    } else {
      const created = createStudent(form)
      toast({
        title: "O'quvchi qo'shildi",
        description: fullName(created),
        actionLabel: 'Profil',
        onAction: () => openDrawer({ type: 'student', studentId: created.id }),
      })
    }
    onClose()
  }

  // Guruhni tahrirlashda faqat faol guruhlar; o'quvchi tugagan guruhda bo'lsa ham ko'rinsin
  const options =
    existing && !groupOptions.some((o) => o.value === existing.groupId)
      ? [{ value: existing.groupId, label: 'Joriy guruh' }, ...groupOptions]
      : groupOptions

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}
      description={existing ? fullName(existing) : "O'quvchi va ota-onasining aloqa ma'lumotlarini kiriting"}
      icon={existing ? UserRoundPen : UserPlus}
      iconColor="green"
      size="lg"
      persistent
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ism" required error={shown.firstName}>
          {(id) => (
            <TextInput
              id={id}
              data-autofocus
              value={form.firstName}
              maxLength={40}
              invalid={!!shown.firstName}
              onChange={(event) => set('firstName', event.target.value)}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Familiya" required error={shown.lastName} hint={duplicate ? "Diqqat: bu guruhda shunday o'quvchi bor" : undefined}>
          {(id) => (
            <TextInput
              id={id}
              value={form.lastName}
              maxLength={40}
              invalid={!!shown.lastName}
              onChange={(event) => set('lastName', event.target.value)}
              autoComplete="off"
            />
          )}
        </Field>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-200">Jinsi</p>
          <SegmentedControl<Gender>
            label="Jinsi"
            fullWidth
            items={[
              { value: 'male', label: "O'g'il bola" },
              { value: 'female', label: 'Qiz bola' },
            ]}
            value={form.gender}
            onChange={(gender) => set('gender', gender)}
          />
        </div>
        <Field label="Guruh" required error={shown.groupId}>
          {(id) => (
            <Select
              id={id}
              value={form.groupId}
              onChange={(value) => set('groupId', value)}
              options={options}
              invalid={!!shown.groupId}
              disabled={!!existing}
            />
          )}
        </Field>
        <Field label="Telefon raqami" required error={shown.phone}>
          {(id) => (
            <TextInput
              id={id}
              type="tel"
              inputMode="tel"
              value={form.phone}
              maxLength={20}
              invalid={!!shown.phone}
              onChange={(event) => set('phone', event.target.value)}
              placeholder="+998 90 123 45 67"
            />
          )}
        </Field>
        <Field label="Tug'ilgan sana" error={shown.birthDate}>
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={form.birthDate}
              max={todayKey()}
              invalid={!!shown.birthDate}
              onChange={(event) => set('birthDate', event.target.value)}
            />
          )}
        </Field>
        <Field label="Ota-ona F.I.Sh.">
          {(id) => (
            <TextInput id={id} value={form.parentName} maxLength={60} onChange={(event) => set('parentName', event.target.value)} />
          )}
        </Field>
        <Field label="Ota-ona telefoni" error={shown.parentPhone}>
          {(id) => (
            <TextInput
              id={id}
              type="tel"
              inputMode="tel"
              value={form.parentPhone}
              maxLength={20}
              invalid={!!shown.parentPhone}
              onChange={(event) => set('parentPhone', event.target.value)}
              placeholder="+998 __ ___ __ __"
            />
          )}
        </Field>
        <Field label="Guruhga qo'shilgan sana" required error={shown.joinedAt}>
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={form.joinedAt}
              invalid={!!shown.joinedAt}
              onChange={(event) => set('joinedAt', event.target.value)}
            />
          )}
        </Field>
        <Field label="Izoh" className="sm:col-span-2" hint="Faqat sizga ko'rinadi">
          {(id) => (
            <TextArea
              id={id}
              rows={2}
              value={form.note}
              maxLength={500}
              onChange={(event) => set('note', event.target.value)}
              placeholder="Masalan: matematikaga qiziqadi, oldingi partada o'tirishi kerak"
            />
          )}
        </Field>
      </div>
    </Modal>
  )
}

export function TransferStudentModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const student = useApp((s) => s.students.find((st) => st.id === studentId))
  const groups = useApp((s) => s.groups)
  const options = useGroupOptions().filter((o) => o.value !== student?.groupId)
  const [target, setTarget] = useState(options[0]?.value ?? '')
  if (!student) return null
  const current = groups.find((g) => g.id === student.groupId)

  const submit = () => {
    if (!target) return
    const moved = transferStudent(student.id, target)
    const targetGroup = groups.find((g) => g.id === target)
    if (moved) {
      toast({
        title: "O'quvchi boshqa guruhga o'tkazildi",
        description: `${fullName(student)}: ${current?.name ?? ''} → ${targetGroup?.name ?? ''}`,
        actionLabel: 'Profil',
        onAction: () => openDrawer({ type: 'student', studentId: moved.id }),
      })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Boshqa guruhga o'tkazish"
      description={`${fullName(student)} · hozirgi guruh: ${current?.name ?? '—'}`}
      icon={ArrowRightLeft}
      iconColor="violet"
      size="sm"
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={!target}>
            O'tkazish
          </Button>
        </>
      }
    >
      {options.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">O'tkazish uchun boshqa faol guruh yo'q.</p>
      ) : (
        <div className="space-y-3">
          <Field label="Yangi guruh" required>
            {(id) => <Select id={id} value={target} onChange={setTarget} options={options} />}
          </Field>
          <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
            Eski guruhdagi davomat va baholar tarix sifatida saqlanadi. O'quvchi yangi guruhda bugungi sanadan boshlab
            hisobga olinadi.
          </p>
        </div>
      )}
    </Modal>
  )
}
