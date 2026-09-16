import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { initials } from '../../lib/text'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface AvatarProps {
  name: string
  color?: AccentColor
  size?: AvatarSize
  /** solid — to'liq rangli fon (oq harflar) */
  variant?: 'soft' | 'solid'
  ring?: boolean
  className?: string
}

const sizeMap: Record<AvatarSize, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
}

/** Bosh harflardan iborat dumaloq avatar (tashqi rasmga bog'liq emas) */
export function Avatar({ name, color = 'blue', size = 'md', variant = 'soft', ring = false, className }: AvatarProps) {
  const c = accent[color]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold',
        variant === 'solid' ? cn(c.gradient, 'text-white') : cn(c.strongBg, c.iconText),
        ring && 'ring-2 ring-white dark:ring-slate-800',
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

interface AvatarStackProps {
  people: { id: string; name: string; color: AccentColor }[]
  max?: number
  size?: AvatarSize
  /** Ko'rsatilmaganlar umumiy soni (max'dan ortig'i) */
  total?: number
  className?: string
}

/** Ustma-ust avatarlar: 👤👤👤 +12 */
export function AvatarStack({ people, max = 4, size = 'xs', total, className }: AvatarStackProps) {
  const visible = people.slice(0, max)
  const rest = (total ?? people.length) - visible.length
  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visible.map((person) => (
        <Avatar key={person.id} name={person.name} color={person.color} size={size} variant="solid" ring />
      ))}
      {rest > 0 ? (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600 ring-2 ring-white dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-800',
            sizeMap[size],
          )}
        >
          +{rest}
        </span>
      ) : null}
    </div>
  )
}
