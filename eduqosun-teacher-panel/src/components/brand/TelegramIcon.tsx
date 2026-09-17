import { cn } from '../../lib/cn'

/** Telegram belgisi (qog'oz samolyot) — rang `text-*` klassi bilan beriladi */
export function TelegramIcon({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-4 w-4 shrink-0 text-sky-500', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="12" cy="12" r="12" fill="currentColor" />
      <path
        fill="#fff"
        d="M5.43 11.87 16.5 7.6c.51-.19.96.12.8.9l-1.89 8.9c-.14.63-.51.78-1.04.49l-2.87-2.12-1.39 1.34c-.15.15-.28.28-.57.28l.2-2.93 5.33-4.82c.23-.2-.05-.32-.36-.12l-6.6 4.15-2.84-.89c-.62-.19-.63-.62.13-.91Z"
      />
    </svg>
  )
}
