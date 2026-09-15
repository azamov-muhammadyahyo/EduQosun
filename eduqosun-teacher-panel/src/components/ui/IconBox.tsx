import type { LucideIcon } from 'lucide-react'
import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'

type IconBoxSize = 'sm' | 'md' | 'lg'

interface IconBoxProps {
  icon: LucideIcon
  color: AccentColor
  size?: IconBoxSize
  className?: string
}

const sizeMap: Record<IconBoxSize, { box: string; icon: string }> = {
  sm: { box: 'h-9 w-9 rounded-lg', icon: 'h-4 w-4' },
  md: { box: 'h-11 w-11 rounded-xl', icon: 'h-5 w-5' },
  lg: { box: 'h-12 w-12 rounded-xl', icon: 'h-6 w-6' },
}

/** Rangli fonli ikonka konteyneri (stat kartalar, tezkor amallar va h.k.) */
export function IconBox({ icon: Icon, color, size = 'md', className = '' }: IconBoxProps) {
  const c = accent[color]
  const s = sizeMap[size]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${s.box} ${c.iconBg} ${c.iconText} ${className}`}
    >
      <Icon className={s.icon} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}
