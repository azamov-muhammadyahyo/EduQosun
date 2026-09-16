import { useState } from 'react'
import { ClipboardCheck, Trash2 } from 'lucide-react'
import type { AssessmentType } from '../../types'
import { assessmentTypeLabel } from '../../data/catalog'
import { todayKey } from '../../lib/date'
import { useApp } from '../../store/appStore'
import { createAssessment, deleteAssessment, updateAssessment } from '../../store/actions/grades'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { confirmAction } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Field, Select, TextInput } from '../ui/Form'
import { Modal } from '../ui/Modal'

const presets: { title: string; type: AssessmentType }[] = [
  { title: 'Darsdagi faollik', type: 'classwork' },
  { title: "Og'zaki so'rov", type: 'oral' },
  { title: 'Nazorat ishi', type: 'quiz' },
  { title: 'Oraliq imtihon', type: 'exam' },
]

/** Baholar jurnaliga yangi ustun qo'shish yoki tahrirlash */
export function AssessmentFormModal({ groupId, assessmentId, onClose }: { groupId: string; assessmentId?: string; onClose: () => void }) {
  const existing = useApp((s) => (assessmentId ? s.assessments.find((a) => a.id === assessmentId) : undefined))
  const group = useApp((s) => s.groups.find((g) => g.id === groupId))
  const [title, setTitle] = useState(existing?.title ?? '')
  const [type, setType] = useState<AssessmentType>(existing?.type ?? 'classwork')
  const [date, setDate] = useState(existing?.date ?? todayKey())
  const [submitted, setSubmitted] = useState(false)

  const submit = () => {
    setSubmitted(true)
    if (!title.trim() || !date) {
      notify.error("Formani to'ldiring", 'Ustun nomi va sanasi majburiy.')
      return
    }
    if (existing) {
      updateAssessment(existing.id, { title: title.trim(), type, date })
      notify.success('Ustun yangilandi', title.trim())
    } else {
      createAssessment({ groupId, title, type, date })
      notify.success("Jurnalga yangi ustun qo'shildi", "Endi o'quvchilarga baho qo'yishingiz mumkin.")
    }
    onClose()
  }

  const remove = async () => {
    if (!existing) return
    const ok = await confirmAction({
      title: "Ustunni o'chirish",
      message: `«${existing.title}» ustuni va undagi barcha baholar o'chiriladi.`,
      confirmLabel: "O'chirish",
    })
    if (!ok) return
    runWithUndo("Ustun o'chirildi", () => deleteAssessment(existing.id), existing.title)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Baholash ustunini tahrirlash' : "Baho ustuni qo'shish"}
      description={group ? `${group.name} · ${group.course}` : undefined}
      icon={ClipboardCheck}
      iconColor="green"
      size="sm"
      onSubmit={submit}
      footer={
        <>
          {existing ? (
            <Button variant="danger-soft" icon={Trash2} className="sm:mr-auto" onClick={() => void remove()}>
              O'chirish
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit">{existing ? 'Saqlash' : "Qo'shish"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {!existing ? (
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => {
                  setTitle(preset.title)
                  setType(preset.type)
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/10"
              >
                {preset.title}
              </button>
            ))}
          </div>
        ) : null}
        <Field label="Ustun nomi" required error={submitted && !title.trim() ? 'Nomini kiriting' : undefined}>
          {(id) => (
            <TextInput
              id={id}
              data-autofocus
              value={title}
              maxLength={40}
              invalid={submitted && !title.trim()}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Masalan: Nazorat ishi 3"
            />
          )}
        </Field>
        <Field label="Turi">
          {(id) => (
            <Select
              id={id}
              value={type}
              onChange={setType}
              options={(Object.keys(assessmentTypeLabel) as AssessmentType[]).map((t) => ({ value: t, label: assessmentTypeLabel[t] }))}
            />
          )}
        </Field>
        <Field label="Sana" required>
          {(id) => <TextInput id={id} type="date" value={date} onChange={(event) => setDate(event.target.value)} />}
        </Field>
      </div>
    </Modal>
  )
}
