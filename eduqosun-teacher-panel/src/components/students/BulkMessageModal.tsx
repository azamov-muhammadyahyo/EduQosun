import { useState } from 'react'
import { Send } from 'lucide-react'
import type { Student } from '../../types'
import { messageTemplates } from '../../data/catalog'
import { fullName } from '../../domain/students'
import { logActivity } from '../../store/actions/feed'
import { sendToTarget } from '../../store/actions/messages'
import { notify } from '../../store/toastStore'
import { AvatarStack } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Field, TextArea } from '../ui/Form'
import { Modal } from '../ui/Modal'
import { SegmentedControl } from '../ui/Tabs'

type Audience = 'student' | 'parent'

interface BulkMessageModalProps {
  students: Student[]
  onClose: () => void
  onSent?: () => void
}

/** Tanlangan o'quvchilarga (yoki ota-onalariga) bir xil xabarni alohida-alohida yuborish */
export function BulkMessageModal({ students, onClose, onSent }: BulkMessageModalProps) {
  const [audience, setAudience] = useState<Audience>('student')
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = () => {
    setSubmitted(true)
    if (!text.trim()) return
    let sent = 0
    for (const student of students) {
      if (sendToTarget({ kind: audience, id: student.id }, text)) sent += 1
    }
    logActivity('message', `${sent} ta ${audience === 'parent' ? 'ota-onaga' : "o'quvchiga"} xabar yuborildi`)
    notify.success('Xabarlar yuborildi', `${sent} ta qabul qiluvchiga shaxsiy xabar jo'natildi.`)
    onSent?.()
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Ommaviy xabar"
      description={`${students.length} ta o'quvchi tanlandi — har biriga alohida xabar boradi`}
      icon={Send}
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" icon={Send}>
            Yuborish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <AvatarStack people={students.map((s) => ({ id: s.id, name: fullName(s), color: s.color }))} max={6} size="sm" />
          <SegmentedControl<Audience>
            size="sm"
            label="Qabul qiluvchi"
            value={audience}
            onChange={setAudience}
            items={[
              { value: 'student', label: "O'quvchilar" },
              { value: 'parent', label: 'Ota-onalar' },
            ]}
          />
        </div>
        <Field label="Xabar matni" required error={submitted && !text.trim() ? 'Xabar matnini kiriting' : undefined}>
          {(id) => (
            <TextArea
              id={id}
              rows={5}
              value={text}
              maxLength={1000}
              data-autofocus
              invalid={submitted && !text.trim()}
              placeholder="Masalan: Ertangi dars 30 daqiqa kechroq boshlanadi."
              onChange={(event) => setText(event.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {messageTemplates.map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => setText(template)}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-500/10"
            >
              {template}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
