import { useRef, useState } from 'react'
import { Maximize2, Pause, Play, Plus, RotateCcw, Square, Timer } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatClock } from '../../lib/date'
import { useSecondTicker } from '../../store/clock'
import {
  addTimerSeconds,
  pauseTimer,
  resetTimer,
  resumeTimer,
  startTimer,
  timerRemaining,
  useUI,
} from '../../store/uiStore'
import { Button } from '../ui/Button'
import { TextInput } from '../ui/Form'
import { Modal } from '../ui/Modal'

const PRESETS = [1, 3, 5, 10, 15, 20, 30, 45]
const LABELS = ['Mustaqil ish', 'Guruhda ishlash', 'Test', 'Tanaffus', 'Muhokama']

const SIZE = 220
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Sinf uchun taymer: oyna yopilsa ham ishlashda davom etadi, tugaganda ovozli signal beradi */
export function TimerModal({ onClose }: { onClose: () => void }) {
  const timer = useUI((s) => s.timer)
  const now = useSecondTicker(timer.status === 'running')
  const [minutes, setMinutes] = useState(Math.max(1, Math.round(timer.durationSec / 60)))
  const [label, setLabel] = useState(timer.label)
  const stageRef = useRef<HTMLDivElement>(null)

  const remaining = timerRemaining(timer, now)
  const total = timer.status === 'idle' ? minutes * 60 : timer.durationSec
  const shown = timer.status === 'idle' ? minutes * 60 : remaining
  const progress = total > 0 ? shown / total : 0
  const warning = timer.status === 'running' && remaining <= 60
  const idleOrDone = timer.status === 'idle' || timer.status === 'done'

  const start = (mins = minutes) => startTimer(Math.max(1, mins) * 60, label.trim())

  const fullscreen = () => {
    const element = stageRef.current
    if (!element) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void element.requestFullscreen?.().catch(() => undefined)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Dars taymeri"
      description="Oynani yopsangiz ham taymer ishlashda davom etadi"
      icon={Timer}
      iconColor="sky"
      size="md"
      footer={
        <>
          {idleOrDone ? (
            <>
              {timer.status === 'done' ? (
                <Button variant="secondary" icon={RotateCcw} onClick={resetTimer}>
                  Tozalash
                </Button>
              ) : null}
              <Button icon={Play} onClick={() => start()}>
                Boshlash
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" icon={Square} onClick={resetTimer}>
                To'xtatish
              </Button>
              <Button variant="soft" icon={Plus} onClick={() => addTimerSeconds(60)}>
                1 daqiqa
              </Button>
              {timer.status === 'running' ? (
                <Button icon={Pause} onClick={pauseTimer}>
                  Pauza
                </Button>
              ) : (
                <Button icon={Play} onClick={resumeTimer}>
                  Davom ettirish
                </Button>
              )}
            </>
          )}
        </>
      }
    >
      <div
        ref={stageRef}
        className="relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50 py-6 dark:from-slate-900/50 dark:to-sky-500/5 [&:fullscreen]:bg-slate-900"
      >
        <button
          type="button"
          onClick={fullscreen}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="To'liq ekran (proyektor uchun)"
          title="To'liq ekran (proyektor uchun)"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="relative">
          <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-slate-200 dark:stroke-slate-700" />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              className={cn(
                'transition-[stroke-dashoffset] duration-300 ease-linear',
                timer.status === 'done' ? 'stroke-emerald-500' : warning ? 'stroke-rose-500' : 'stroke-sky-500',
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" aria-live="polite">
            <span
              className={cn(
                'text-5xl font-bold tabular-nums tracking-tight',
                timer.status === 'done' ? 'text-emerald-600' : warning ? 'text-rose-600' : 'text-slate-900 dark:text-white',
              )}
            >
              {formatClock(shown)}
            </span>
            <span className="mt-1 max-w-[160px] truncate text-sm text-slate-500 dark:text-slate-400">
              {timer.status === 'done'
                ? 'Vaqt tugadi!'
                : timer.status === 'paused'
                  ? 'Pauza'
                  : timer.label || (timer.status === 'running' ? 'Ketmoqda' : 'Tayyor')}
            </span>
          </div>
        </div>
      </div>

      {idleOrDone ? (
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-[13px] font-medium text-slate-700 dark:text-slate-200">Tezkor tanlov</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setMinutes(preset)
                    if (timer.status === 'done') resetTimer()
                  }}
                  onDoubleClick={() => start(preset)}
                  className={cn(
                    'h-10 rounded-xl border text-sm font-semibold transition-colors',
                    minutes === preset
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50',
                  )}
                >
                  {preset} daq
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-200">Daqiqa</span>
              <TextInput
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(event) => setMinutes(Math.max(1, Math.min(180, Number(event.target.value) || 1)))}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-200">Nomi (ixtiyoriy)</span>
              <TextInput value={label} maxLength={30} onChange={(event) => setLabel(event.target.value)} placeholder="Masalan: Mustaqil ish" />
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LABELS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLabel(item)}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-sky-100 hover:text-sky-700 dark:bg-slate-700/60 dark:text-slate-300"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
