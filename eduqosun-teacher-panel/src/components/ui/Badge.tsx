import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'

interface BadgeProps {
  color?: AccentColor
  children: ReactNode
  /** Chap tomondagi rangli nuqta */
  dot?: boolean
  /** Nuqta miltillasinmi (jonli holat) */
  pulse?: boolean
  icon?: LucideIcon
  size?: 'xs' | 'sm'
  /** solid — to'liq rangli fon */
  variant?: 'soft' | 'solid' | 'outline'
  className?: string
}

export function Badge({
  color = 'slate',
  children,
  dot = false,
  pulse = false,
  icon: Icon,
  size = 'sm',
  variant = 'soft',
  className,
}: BadgeProps) {
  const c = accent[color]
  const tone =
    variant === 'solid'
      ? cn(c.solidBg, 'text-white')
      : variant === 'outline'
        ? cn('bg-white ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:ring-slate-600', c.iconText)
        : cn('ring-1 ring-inset', c.badge)
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full font-medium',
        size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        tone,
        className,
      )}
    >
      {dot ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse ? <span className={cn('absolute inline-flex h-full w-full animate-soft-ping rounded-full', c.solidBg)} /> : null}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', variant === 'solid' ? 'bg-white' : c.solidBg)} />
        </span>
      ) : null}
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </span>
  )
}
