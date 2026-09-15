import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  initials: string
  color?: AccentColor
  size?: AvatarSize
  className?: string
}

const sizeMap: Record<AvatarSize, string> = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
}

/** Bosh harflardan iborat dumaloq avatar (tashqi rasmga bog'liq emas) */
export function Avatar({ initials, color = 'blue', size = 'md', className = '' }: AvatarProps) {
  const c = accent[color]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${c.iconBg} ${c.iconText} ${sizeMap[size]} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
