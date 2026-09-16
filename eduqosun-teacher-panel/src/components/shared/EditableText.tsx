import { useEffect, useState, type ReactNode } from 'react'
import { Check, PencilLine, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { TextArea, TextInput } from '../ui/Form'

interface EditableTextProps {
  label: string
  icon?: LucideIcon
  value: string
  placeholder: string
  onSave: (value: string) => void
  multiline?: boolean
  maxLength?: number
  disabled?: boolean
  /** Ko'rish rejimidagi qo'shimcha element */
  extra?: ReactNode
}

/** Ko'rish ⇄ tahrirlash rejimli matn bloki (dars mavzusi, uy vazifasi, izoh) */
export function EditableText({
  label,
  icon: Icon,
  value,
  placeholder,
  onSave,
  multiline = false,
  maxLength = 400,
  disabled = false,
  extra,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const save = () => {
    onSave(draft.trim())
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  return (
    <section className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          {label}
        </h3>
        {!editing && !disabled ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
          >
            <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
            {value ? 'Tahrirlash' : "Qo'shish"}
          </button>
        ) : null}
      </div>
      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <TextArea
              autoFocus
              rows={3}
              value={draft}
              maxLength={maxLength}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={placeholder}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) save()
                if (event.key === 'Escape') {
                  event.stopPropagation()
                  cancel()
                }
              }}
            />
          ) : (
            <TextInput
              autoFocus
              value={draft}
              maxLength={maxLength}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={placeholder}
              onKeyDown={(event) => {
                if (event.key === 'Enter') save()
                if (event.key === 'Escape') {
                  event.stopPropagation()
                  cancel()
                }
              }}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" icon={X} onClick={cancel}>
              Bekor
            </Button>
            <Button size="sm" icon={Check} onClick={save}>
              Saqlash
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className={cn('whitespace-pre-line text-sm leading-relaxed', value ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400')}>
            {value || placeholder}
          </p>
          {extra}
        </>
      )}
    </section>
  )
}
