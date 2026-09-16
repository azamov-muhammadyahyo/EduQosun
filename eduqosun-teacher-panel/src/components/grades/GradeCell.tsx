import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { scoreTone } from '../../lib/colors'
import { formatGrade, parseGradeInput } from '../../domain/grades'
import { notify } from '../../store/toastStore'

const toneClasses = {
  green: 'text-emerald-700 dark:text-emerald-300',
  blue: 'text-blue-700 dark:text-blue-300',
  amber: 'text-amber-700 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  slate: 'text-slate-400',
} as const

interface GradeCellProps {
  value: number | null
  row: number
  col: number
  editable: boolean
  label: string
  onCommit: (value: number | null) => void
}

/** Kursor bilan jurnal kataklari orasida yurish (Excel uslubi); tahrirlanmaydigan ustunlar o'tkazib yuboriladi */
function focusCell(row: number, col: number, dRow: number, dCol: number): void {
  for (let step = 1; step <= 40; step += 1) {
    const target = document.querySelector<HTMLInputElement>(`[data-grade-cell="${row + dRow * step}:${col + dCol * step}"]`)
    if (target) {
      target.focus()
      return
    }
    if (dRow !== 0) return
  }
}

/**
 * Jurnal katagi: yozib Enter/Tab bosilsa saqlanadi, Esc — bekor qilinadi,
 * strelkalar bilan qo'shni kataklarga o'tiladi.
 */
export const GradeCell = memo(function GradeCell({ value, row, col, editable, label, onCommit }: GradeCellProps) {
  const [draft, setDraft] = useState(formatGrade(value))
  // Klaviatura bilan boshqa katakka o'tilganda blur qayta saqlamasligi uchun
  const skipBlur = useRef(false)

  useEffect(() => setDraft(formatGrade(value)), [value])

  const commit = () => {
    const parsed = parseGradeInput(draft)
    if (parsed === undefined) {
      notify.error("Noto'g'ri baho", "Baho 0 dan 10 gacha bo'lgan son bo'lishi kerak.")
      setDraft(formatGrade(value))
      return
    }
    if (parsed !== value) onCommit(parsed)
    setDraft(formatGrade(parsed))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      Enter: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    }
    if (event.key === 'Escape') {
      setDraft(formatGrade(value))
      skipBlur.current = true
      event.currentTarget.blur()
      return
    }
    const move = moves[event.key]
    if (!move) return
    // Matn ichida chap/o'ng strelka — kursorni siljitish uchun qoldiriladi
    const input = event.currentTarget
    if (event.key === 'ArrowLeft' && input.selectionStart !== 0) return
    if (event.key === 'ArrowRight' && input.selectionEnd !== input.value.length) return
    event.preventDefault()
    commit()
    skipBlur.current = true
    focusCell(row, col, move[0], move[1])
    if (document.activeElement === input) skipBlur.current = false
  }

  if (!editable) {
    return (
      <span className={cn('inline-flex h-8 w-12 items-center justify-center rounded-lg text-sm font-semibold tabular-nums', toneClasses[scoreTone(value)])} title={label}>
        {value === null ? '·' : formatGrade(value)}
      </span>
    )
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      aria-label={label}
      data-grade-cell={`${row}:${col}`}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (skipBlur.current) skipBlur.current = false
        else commit()
      }}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={onKeyDown}
      placeholder="·"
      className={cn(
        'h-8 w-12 rounded-lg border border-transparent bg-transparent text-center text-sm font-semibold tabular-nums outline-none transition-colors placeholder:text-slate-300 hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:placeholder:text-slate-600 dark:hover:border-slate-600 dark:focus:bg-slate-900',
        toneClasses[scoreTone(value)],
      )}
    />
  )
})
