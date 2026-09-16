import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Copy, FileQuestion, Info, Plus, Trash2, X } from 'lucide-react'
import type { TestQuestion } from '../../types'
import { addDays, todayKey } from '../../lib/date'
import { createId } from '../../lib/id'
import { cn } from '../../lib/cn'
import { validateTest } from '../../domain/tests'
import { useGroupOptions } from '../../hooks/useOptions'
import { useApp } from '../../store/appStore'
import { saveTest, type TestDraft } from '../../store/actions/tests'
import { notify, toast } from '../../store/toastStore'
import { openModal } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Field, Select, TextArea, TextInput } from '../ui/Form'
import { IconButton } from '../ui/IconButton'
import { Modal } from '../ui/Modal'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const MAX_OPTIONS = 6

function blankQuestion(): TestQuestion {
  return { id: createId('q'), text: '', options: ['', '', '', ''], correct: 0 }
}

interface QuestionEditorProps {
  index: number
  total: number
  question: TestQuestion
  locked: boolean
  onChange: (question: TestQuestion) => void
  onMove: (step: -1 | 1) => void
  onDuplicate: () => void
  onRemove: () => void
}

function QuestionEditor({ index, total, question, locked, onChange, onMove, onDuplicate, onRemove }: QuestionEditorProps) {
  const setOption = (optionIndex: number, text: string) =>
    onChange({ ...question, options: question.options.map((o, i) => (i === optionIndex ? text : o)) })

  const removeOption = (optionIndex: number) => {
    const options = question.options.filter((_, i) => i !== optionIndex)
    let correct = question.correct
    if (optionIndex === question.correct) correct = 0
    else if (optionIndex < question.correct) correct -= 1
    onChange({ ...question, options, correct })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            {index + 1}
          </span>
          {index + 1}-savol
        </span>
        {!locked ? (
          <div className="flex items-center gap-0.5">
            <IconButton icon={ArrowUp} label="Yuqoriga" size="xs" disabled={index === 0} onClick={() => onMove(-1)} />
            <IconButton icon={ArrowDown} label="Pastga" size="xs" disabled={index === total - 1} onClick={() => onMove(1)} />
            <IconButton icon={Copy} label="Nusxa olish" size="xs" onClick={onDuplicate} />
            <IconButton icon={Trash2} label="Savolni o'chirish" size="xs" variant="danger" disabled={total === 1} onClick={onRemove} />
          </div>
        ) : null}
      </div>

      <TextArea
        rows={2}
        value={question.text}
        disabled={locked}
        maxLength={400}
        onChange={(event) => onChange({ ...question, text: event.target.value })}
        placeholder="Savol matnini kiriting"
        aria-label={`${index + 1}-savol matni`}
      />

      <div className="mt-3 space-y-2" role="radiogroup" aria-label="To'g'ri javob">
        {question.options.map((option, optionIndex) => {
          const correct = question.correct === optionIndex
          return (
            <div key={optionIndex} className="flex items-center gap-2">
              <button
                type="button"
                role="radio"
                aria-checked={correct}
                disabled={locked}
                onClick={() => onChange({ ...question, correct: optionIndex })}
                title="To'g'ri javob sifatida belgilash"
                className={cn(
                  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors disabled:cursor-not-allowed',
                  correct
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-600 dark:text-slate-400',
                )}
              >
                {OPTION_LETTERS[optionIndex]}
              </button>
              <TextInput
                value={option}
                disabled={locked}
                maxLength={200}
                onChange={(event) => setOption(optionIndex, event.target.value)}
                placeholder={`${OPTION_LETTERS[optionIndex]} variant`}
                className={cn('h-9', correct && 'border-emerald-300 dark:border-emerald-500/50')}
                aria-label={`${OPTION_LETTERS[optionIndex]} variant`}
              />
              {!locked && question.options.length > 2 ? (
                <IconButton icon={X} label="Variantni olib tashlash" size="xs" variant="danger" onClick={() => removeOption(optionIndex)} />
              ) : null}
            </div>
          )
        })}
      </div>
      {!locked && question.options.length < MAX_OPTIONS ? (
        <button
          type="button"
          onClick={() => onChange({ ...question, options: [...question.options, ''] })}
          className="mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Variant qo'shish
        </button>
      ) : null}
    </div>
  )
}

export function TestBuilderModal({ testId, groupId, onClose }: { testId?: string; groupId?: string; onClose: () => void }) {
  const existing = useApp((s) => (testId ? s.tests.find((t) => t.id === testId) : undefined))
  const groupOptions = useGroupOptions()
  const locked = !!existing && existing.status !== 'draft'

  const [draft, setDraft] = useState<TestDraft>(() =>
    existing
      ? {
          id: existing.id,
          title: existing.title,
          description: existing.description,
          groupId: existing.groupId,
          durationMin: existing.durationMin,
          date: existing.date,
          questions: existing.questions.map((q) => ({ ...q, options: [...q.options] })),
        }
      : {
          title: '',
          description: '',
          groupId: groupId ?? groupOptions[0]?.value ?? '',
          durationMin: 20,
          date: addDays(todayKey(), 2),
          questions: [blankQuestion()],
        },
  )
  const [submitted, setSubmitted] = useState(false)
  const errors = useMemo(() => {
    const list = validateTest(draft)
    if (!draft.groupId) list.unshift('Guruhni tanlang')
    return list
  }, [draft])

  const set = <K extends keyof TestDraft>(key: K, value: TestDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value }))

  const updateQuestion = (index: number, question: TestQuestion) =>
    set(
      'questions',
      draft.questions.map((q, i) => (i === index ? question : q)),
    )

  const moveQuestion = (index: number, step: -1 | 1) => {
    const list = [...draft.questions]
    const target = index + step
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    set('questions', list)
  }

  const save = (publish: boolean) => {
    setSubmitted(true)
    if (errors.length > 0) {
      notify.error("Testni saqlab bo'lmadi", errors[0])
      return
    }
    const status = locked && existing ? existing.status : publish ? 'published' : 'draft'
    const test = saveTest(draft, status)
    toast({
      title: status === 'published' && !locked ? "Test e'lon qilindi" : 'Test saqlandi',
      description: `${test.title} · ${test.questions.length} ta savol`,
      actionLabel: "Ko'rib chiqish",
      onAction: () => openModal({ type: 'test-preview', testId: test.id }),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Testni tahrirlash' : 'Test yaratish'}
      description="Savollar, javob variantlari va to'g'ri javoblarni kiriting"
      icon={FileQuestion}
      iconColor="indigo"
      size="xl"
      persistent
      footer={
        <>
          <span className="mr-auto hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
            {draft.questions.length} ta savol · {draft.durationMin} daqiqa
          </span>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          {locked ? (
            <Button onClick={() => save(false)}>Saqlash</Button>
          ) : (
            <>
              <Button variant="soft" onClick={() => save(false)}>
                Qoralama sifatida saqlash
              </Button>
              <Button onClick={() => save(true)}>E'lon qilish</Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {locked ? (
          <div className="flex gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Bu test allaqachon e'lon qilingan — natijalar buzilmasligi uchun savollarni o'zgartirib bo'lmaydi. Nom, tavsif,
              sana va davomiylikni tahrirlash mumkin. Savollarni o'zgartirish uchun testdan nusxa oling.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Test nomi" required className="md:col-span-2">
            {(id) => (
              <TextInput
                id={id}
                data-autofocus
                value={draft.title}
                maxLength={80}
                invalid={submitted && !draft.title.trim()}
                onChange={(event) => set('title', event.target.value)}
                placeholder="Masalan: JavaScript asoslari"
              />
            )}
          </Field>
          <Field label="Guruh" required>
            {(id) => (
              <Select id={id} value={draft.groupId} onChange={(value) => set('groupId', value)} options={groupOptions} disabled={locked} />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sana">
              {(id) => <TextInput id={id} type="date" value={draft.date} onChange={(event) => set('date', event.target.value)} />}
            </Field>
            <Field label="Daqiqa">
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  min={1}
                  max={240}
                  value={draft.durationMin}
                  onChange={(event) => set('durationMin', Math.max(0, Math.min(240, Number(event.target.value) || 0)))}
                />
              )}
            </Field>
          </div>
          <Field label="Tavsif" className="md:col-span-4">
            {(id) => (
              <TextInput
                id={id}
                value={draft.description}
                maxLength={200}
                onChange={(event) => set('description', event.target.value)}
                placeholder="Test qaysi mavzularni qamrab olishi haqida qisqacha"
              />
            )}
          </Field>
        </div>

        <div className="space-y-3">
          {draft.questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              index={index}
              total={draft.questions.length}
              question={question}
              locked={locked}
              onChange={(q) => updateQuestion(index, q)}
              onMove={(step) => moveQuestion(index, step)}
              onDuplicate={() =>
                set('questions', [
                  ...draft.questions.slice(0, index + 1),
                  { ...question, id: createId('q'), options: [...question.options] },
                  ...draft.questions.slice(index + 1),
                ])
              }
              onRemove={() => set('questions', draft.questions.filter((_, i) => i !== index))}
            />
          ))}
        </div>

        {!locked ? (
          <button
            type="button"
            onClick={() => set('questions', [...draft.questions, blankQuestion()])}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3.5 text-sm font-semibold text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/5 dark:hover:text-blue-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Savol qo'shish
          </button>
        ) : null}

        {submitted && errors.length > 0 ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" role="alert">
            <p className="font-semibold">Quyidagilarni to'g'rilang:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {errors.slice(0, 6).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
