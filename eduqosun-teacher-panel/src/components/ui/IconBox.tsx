import type { LucideIcon } from 'lucide-react'
import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'

type IconBoxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface IconBoxProps {
  icon: LucideIcon
  color: AccentColor
  size?: IconBoxSize
  /** soft — och fon, solid — to'liq rangli (gradiyent) */
  variant?: 'soft' | 'solid' | 'strong'
  rounded?: 'lg' | 'full'
  className?: string
}

const sizeMap: Record<IconBoxSize, { box: string; icon: string }> = {
  xs: { box: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
  sm: { box: 'h-9 w-9', icon: 'h-4 w-4' },
  md: { box: 'h-11 w-11', icon: 'h-5 w-5' },
  lg: { box: 'h-12 w-12', icon: 'h-6 w-6' },
  xl: { box: 'h-14 w-14', icon: 'h-7 w-7' },
}

/** Rangli fonli ikonka konteyneri (stat kartalar, tezkor amallar va h.k.) */
export function IconBox({ icon: Icon, color, size = 'md', variant = 'soft', rounded = 'lg', className }: IconBoxProps) {
  const c = accent[color]
  const s = sizeMap[size]
  const tone =
    variant === 'solid'
      ? cn(c.gradient, 'text-white shadow-sm', c.shadow)
      : variant === 'strong'
        ? cn(c.strongBg, c.iconText)
        : cn(c.iconBg, c.iconText)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        s.box,
        rounded === 'full' ? 'rounded-full' : size === 'xs' || size === 'sm' ? 'rounded-lg' : 'rounded-xl',
        tone,
        className,
      )}
    >
      <Icon className={s.icon} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}
