import { cn } from '../../lib/cn'

/** EduQosun belgisi: qalqon ichidagi bitiruvchi qalpoq */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="eq-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path d="M20 2.5 34.5 8v11.2c0 8.6-6 15.3-14.5 18.3C11.5 34.5 5.5 27.8 5.5 19.2V8L20 2.5Z" fill="url(#eq-logo)" />
      <path d="M20 12.5 30 17l-10 4.6L10 17l10-4.5Z" fill="#fff" />
      <path d="M14 19.6v4.2c0 1.7 2.7 3.2 6 3.2s6-1.5 6-3.2v-4.2l-6 2.8-6-2.8Z" fill="#fff" fillOpacity="0.85" />
      <path d="M29 17.6v5.2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function BrandName({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <LogoMark className="h-10 w-10 shrink-0" />
      <div className="min-w-0 leading-tight">
        <p className={cn('truncate text-lg font-bold tracking-tight', inverted ? 'text-white' : 'text-slate-900 dark:text-white')}>
          EduQosun
        </p>
        <p className={cn('truncate text-[11px]', inverted ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400')}>
          Ta'lim – kelajak kaliti
        </p>
      </div>
    </div>
  )
}

/** Tuvakdagi o'simlik — sidebar kartochkasi uchun */
export function PlantIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden="true" focusable="false">
      <path d="M32 58V26" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M32 44c-9 0-15-6-16-15 9 0 15 5 16 15Z" fill="#10B981" />
      <path d="M32 38c8-1 13-7 13-15-8 1-13 6-13 15Z" fill="#34D399" />
      <path d="M32 30c-5-2-8-7-7-13 5 2 8 7 7 13Z" fill="#6EE7B7" />
      <path d="M32 50c6 0 11-4 12-10-6 0-11 4-12 10Z" fill="#059669" />
      <path d="M20 58h24l-3 18a3 3 0 0 1-3 2.5H26a3 3 0 0 1-3-2.5L20 58Z" fill="#1E3A8A" />
      <rect x="18" y="55" width="28" height="5" rx="2" fill="#2563EB" />
    </svg>
  )
}
