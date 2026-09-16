import { useState } from 'react'
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Eye, RotateCcw, Trophy } from 'lucide-react'
import { cn } from '../../lib/cn'
import { percent } from '../../lib/format'
import { useApp } from '../../store/appStore'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ProgressBar } from '../ui/ProgressBar'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/** Testni o'quvchi ko'zi bilan ko'rib chiqish (sinov rejimi, natija saqlanmaydi) */
export function TestPreviewModal({ testId, onClose }: { testId: string; onClose: () => void }) {
  const test = useApp((s) => s.tests.find((t) => t.id === testId))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>(() => test?.questions.map(() => -1) ?? [])
  const [finished, setFinished] = useState(false)

  if (!test) return null
  const total = test.questions.length
  const question = test.questions[index]
  const answered = answers.filter((a) => a >= 0).length
  const correct = test.questions.filter((q, i) => answers[i] === q.correct).length
  const score = percent(correct, total)

  const restart = () => {
    setAnswers(test.questions.map(() => -1))
    setIndex(0)
    setFinished(false)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${test.title} — sinov rejimi`}
      description="Testni o'quvchi ko'zi bilan tekshiring. Javoblar saqlanmaydi."
      icon={Eye}
      iconColor="indigo"
      size="lg"
      footer={
        finished ? (
          <>
            <Button variant="secondary" icon={RotateCcw} onClick={restart}>
              Qayta boshlash
            </Button>
            <Button onClick={onClose}>Yopish</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" icon={ArrowLeft} disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              Oldingi
            </Button>
            {index < total - 1 ? (
              <Button iconRight={ArrowRight} onClick={() => setIndex((i) => i + 1)}>
                Keyingi
              </Button>
            ) : (
              <Button variant="success" icon={CircleCheck} onClick={() => setFinished(true)}>
                Yakunlash
              </Button>
            )}
          </>
        )
      }
    >
      {total === 0 ? (
        <p className="text-sm text-slate-500">Bu testda hali savol yo'q.</p>
      ) : finished ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-5 text-white">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Trophy className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-3xl font-bold">{score}%</p>
              <p className="text-sm text-white/80">
                {total} ta savoldan {correct} tasiga to'g'ri javob berildi
              </p>
            </div>
          </div>
          <ol className="space-y-2">
            {test.questions.map((q, i) => {
              const ok = answers[i] === q.correct
              return (
                <li key={q.id} className="flex gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  {ok ? (
                    <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-label="To'g'ri" />
                  ) : (
                    <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-label="Noto'g'ri" />
                  )}
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {i + 1}. {q.text}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      To'g'ri javob:{' '}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {LETTERS[q.correct]}) {q.options[q.correct]}
                      </span>
                      {!ok ? (
                        <>
                          {' · '}Tanlangan:{' '}
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {answers[i] >= 0 ? `${LETTERS[answers[i]]}) ${q.options[answers[i]]}` : 'javobsiz'}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      ) : (
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {index + 1} / {total}
            </span>
            <ProgressBar value={((index + 1) / total) * 100} color="indigo" size="sm" className="flex-1" />
            <span className="text-xs text-slate-500 dark:text-slate-400">{answered} ta javob</span>
          </div>

          <p className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">{question.text}</p>

          <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label="Javob variantlari">
            {question.options.map((option, optionIndex) => {
              const selected = answers[index] === optionIndex
              return (
                <button
                  key={optionIndex}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((prev) => prev.map((a, i) => (i === index ? optionIndex : a)))}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors',
                    selected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-100'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/40',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                      selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
                    )}
                  >
                    {LETTERS[optionIndex]}
                  </span>
                  {option}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-1.5" aria-label="Savollar">
            {test.questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}-savol`}
                aria-current={i === index ? 'step' : undefined}
                className={cn(
                  'h-8 w-8 rounded-lg text-xs font-semibold transition-colors',
                  i === index
                    ? 'bg-indigo-600 text-white'
                    : answers[i] >= 0
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300',
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
