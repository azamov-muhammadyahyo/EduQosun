import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Klaviatura tugmasi belgisi */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 font-sans text-[11px] font-medium text-slate-500 shadow-[0_1px_0_0_rgb(226_232_240)] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:shadow-none',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

/** Yuklanish skeleti */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-slate-200/70 dark:bg-slate-700/50', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/5" />
    </div>
  )
}

/** Kartadagi ajratuvchi sarlavha */
export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) return <div className={cn('h-px bg-slate-100 dark:bg-slate-700/60', className)} />
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="h-px flex-1 bg-slate-100 dark:bg-slate-700/60" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="h-px flex-1 bg-slate-100 dark:bg-slate-700/60" />
    </div>
  )
}

/** Kalit–qiymat qatori (ma'lumot panellari uchun) */
export function InfoRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 py-2 text-sm', className)}>
      <span className="shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
      <span className="min-w-0 text-right font-medium text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  )
}
