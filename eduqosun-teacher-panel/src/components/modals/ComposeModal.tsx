import { useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import type { ComposeTarget, ConversationKind } from '../../types'
import { messageTemplates } from '../../data/catalog'
import { compareStudents, fullName } from '../../domain/students'
import { navigate } from '../../router'
import { useApp } from '../../store/appStore'
import { sendToTarget } from '../../store/actions/messages'
import { logActivity } from '../../store/actions/feed'
import { notify, toast } from '../../store/toastStore'
import { Button } from '../ui/Button'
import { Field, Select, TextArea, type OptionGroup } from '../ui/Form'
import { Modal } from '../ui/Modal'
import { SegmentedControl } from '../ui/Tabs'

const MAX_LENGTH = 1000

/** Xabar yuborish: o'quvchi, ota-ona yoki butun guruhga */
export function ComposeModal({ target, text, onClose }: { target?: ComposeTarget; text?: string; onClose: () => void }) {
  const groups = useApp((s) => s.groups)
  const students = useApp((s) => s.students)
  const [kind, setKind] = useState<ConversationKind>(target?.kind ?? 'student')
  const [recipient, setRecipient] = useState(target?.id ?? '')
  const [body, setBody] = useState(text ?? '')
  const [submitted, setSubmitted] = useState(false)

  const activeGroups = useMemo(() => groups.filter((g) => g.status === 'active'), [groups])

  const studentGroups = useMemo<OptionGroup<string>[]>(
    () =>
      activeGroups.map((group) => ({
        label: `${group.name} · ${group.course}`,
        options: students
          .filter((s) => s.groupId === group.id && s.status === 'active')
          .sort(compareStudents)
          .map((s) => ({
            value: s.id,
            label: kind === 'parent' ? `${s.parentName || 'Ota-ona'} (${fullName(s)})` : fullName(s),
          })),
      })),
    [activeGroups, students, kind],
  )

  const groupOptions = activeGroups.map((g) => ({ value: g.id, label: `Guruh ${g.name} · ${g.course}` }))
  const validRecipient =
    kind === 'group' ? activeGroups.some((g) => g.id === recipient) : studentGroups.some((g) => g.options.some((o) => o.value === recipient))

  const changeKind = (next: ConversationKind) => {
    setKind(next)
    // Ota-ona ↔ o'quvchi almashganda tanlangan o'quvchi saqlanadi
    if ((next === 'group') !== (kind === 'group')) setRecipient('')
  }

  const submit = () => {
    setSubmitted(true)
    if (!validRecipient || !body.trim()) {
      notify.error("Xabarni yuborib bo'lmadi", !validRecipient ? 'Qabul qiluvchini tanlang.' : 'Xabar matnini kiriting.')
      return
    }
    const conversationId = sendToTarget({ kind, id: recipient }, body)
    if (!conversationId) {
      notify.error("Xabarni yuborib bo'lmadi", 'Qabul qiluvchi topilmadi.')
      return
    }
    const label =
      kind === 'group'
        ? `Guruh ${groups.find((g) => g.id === recipient)?.name ?? ''}`
        : fullName(students.find((s) => s.id === recipient) ?? { firstName: '', lastName: '' })
    logActivity('message', kind === 'group' ? `${label} ga xabar yuborildi` : `${label}${kind === 'parent' ? ' ota-onasiga' : 'ga'} xabar yuborildi`)
    toast({
      title: 'Xabar yuborildi',
      description: label,
      actionLabel: 'Suhbatni ochish',
      onAction: () => navigate(`messages/${conversationId}`),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Xabar yuborish"
      description="O'quvchi, ota-ona yoki butun guruhga xabar yozing"
      icon={Send}
      iconColor="rose"
      size="md"
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
        <SegmentedControl<ConversationKind>
          label="Qabul qiluvchi turi"
          fullWidth
          items={[
            { value: 'student', label: "O'quvchi" },
            { value: 'parent', label: 'Ota-ona' },
            { value: 'group', label: 'Guruh' },
          ]}
          value={kind}
          onChange={changeKind}
        />

        <Field label="Kimga" required error={submitted && !validRecipient ? 'Qabul qiluvchini tanlang' : undefined}>
          {(id) =>
            kind === 'group' ? (
              <Select
                id={id}
                value={recipient}
                onChange={setRecipient}
                options={[{ value: '', label: 'Guruhni tanlang...' }, ...groupOptions]}
                invalid={submitted && !validRecipient}
              />
            ) : (
              <Select
                id={id}
                value={recipient}
                onChange={setRecipient}
                options={[{ value: '', label: kind === 'parent' ? 'Ota-onani tanlang...' : "O'quvchini tanlang..." }]}
                groups={studentGroups}
                invalid={submitted && !validRecipient}
              />
            )
          }
        </Field>

        <Field
          label="Xabar"
          required
          error={submitted && !body.trim() ? 'Xabar matnini kiriting' : undefined}
          aside={
            <span className="text-[11px] tabular-nums text-slate-400">
              {body.length}/{MAX_LENGTH}
            </span>
          }
        >
          {(id) => (
            <TextArea
              id={id}
              data-autofocus={target ? true : undefined}
              rows={5}
              maxLength={MAX_LENGTH}
              value={body}
              invalid={submitted && !body.trim()}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault()
                  submit()
                }
              }}
              placeholder="Xabar matnini yozing... (Ctrl + Enter — yuborish)"
            />
          )}
        </Field>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Tezkor shablonlar</p>
          <div className="flex flex-wrap gap-1.5">
            {messageTemplates.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => setBody((prev) => (prev.trim() ? `${prev.trim()} ${template}` : template))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-500/10"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
