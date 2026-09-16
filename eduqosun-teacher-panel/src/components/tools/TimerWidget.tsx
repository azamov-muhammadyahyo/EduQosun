import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Pause, Play, Timer, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatClock } from '../../lib/date'
import { playChime } from '../../lib/sound'
import { getAppState } from '../../store/appStore'
import { useSecondTicker } from '../../store/clock'
import { toast } from '../../store/toastStore'
import {
  finishTimer,
  openModal,
  pauseTimer,
  resetTimer,
  resumeTimer,
  timerRemaining,
  uiStore,
  useUI,
} from '../../store/uiStore'

/** Taymer tugashini kuzatadi (oyna yopiq bo'lsa ham) */
export function TimerWatcher() {
  const timer = useUI((s) => s.timer)

  useEffect(() => {
    if (timer.status !== 'running' || timer.endsAt === null) return undefined
    const id = window.setTimeout(() => {
      finishTimer()
      if (getAppState().settings.sound) {
        playChime('done')
        window.setTimeout(() => playChime('done'), 900)
      }
      const label = uiStore.getState().timer.label
      toast({
        tone: 'info',
        title: 'Vaqt tugadi!',
        description: label ? `«${label}» uchun ajratilgan vaqt yakunlandi.` : 'Taymer yakunlandi.',
        actionLabel: 'Taymer',
        onAction: () => openModal({ type: 'timer' }),
      })
    }, Math.max(0, timer.endsAt - Date.now()))
    return () => window.clearTimeout(id)
  }, [timer.status, timer.endsAt])

  return null
}

/** Taymer oynasi yopiq bo'lganda pastki chap burchakdagi kichik ko'rsatkich */
export function FloatingTimer() {
  const timer = useUI((s) => s.timer)
  const modalOpen = useUI((s) => s.modal?.type === 'timer')
  const now = useSecondTicker(timer.status === 'running' && !modalOpen)

  if (timer.status === 'idle' || modalOpen) return null
  const remaining = timerRemaining(timer, now)
  const done = timer.status === 'done'
  const warning = timer.status === 'running' && remaining <= 60

  return createPortal(
    <div
      className={cn(
        'print-hidden fixed bottom-4 left-4 z-[65] flex animate-toast-in items-center gap-2 rounded-2xl border bg-white p-1.5 pr-2 shadow-lift dark:bg-slate-800 lg:left-64',
        done ? 'border-emerald-300 dark:border-emerald-500/50' : warning ? 'border-rose-300 dark:border-rose-500/50' : 'border-slate-200 dark:border-slate-700',
      )}
    >
      <button
        type="button"
        onClick={() => openModal({ type: 'timer' })}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50"
        aria-label="Taymerni ochish"
      >
        <span
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg text-white',
            done ? 'animate-pulse bg-emerald-500' : warning ? 'bg-rose-500' : 'bg-sky-500',
          )}
        >
          <Timer className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="leading-tight">
          <span
            className={cn(
              'block text-lg font-bold tabular-nums',
              done ? 'text-emerald-600' : warning ? 'text-rose-600' : 'text-slate-900 dark:text-white',
            )}
          >
            {done ? 'Tugadi' : formatClock(remaining)}
          </span>
          <span className="block max-w-[140px] truncate text-[11px] text-slate-500 dark:text-slate-400">
            {timer.label || (timer.status === 'paused' ? 'Pauza' : 'Dars taymeri')}
          </span>
        </span>
      </button>
      {timer.status === 'running' ? (
        <button
          type="button"
          onClick={pauseTimer}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Pauza"
        >
          <Pause className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : timer.status === 'paused' ? (
        <button
          type="button"
          onClick={resumeTimer}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Davom ettirish"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={resetTimer}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
        aria-label="Taymerni yopish"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>,
    document.body,
  )
}
