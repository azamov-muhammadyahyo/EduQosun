import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

type IconButtonSize = 'xs' | 'sm' | 'md'
type IconButtonVariant = 'ghost' | 'outline' | 'soft' | 'danger'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon
  /** Ekran o'quvchilari uchun majburiy nom */
  label: string
  size?: IconButtonSize
  variant?: IconButtonVariant
  active?: boolean
  /** Ikonka ustidagi qizil nuqta yoki son */
  badge?: number | boolean
}

const sizeMap: Record<IconButtonSize, { box: string; icon: string }> = {
  xs: { box: 'h-7 w-7 rounded-md', icon: 'h-3.5 w-3.5' },
  sm: { box: 'h-8 w-8 rounded-lg', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5' },
}

const variantMap: Record<IconButtonVariant, string> = {
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-white',
  outline:
    'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white',
  soft: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20',
  danger: 'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, size = 'sm', variant = 'ghost', active = false, badge, className, type = 'button', ...props },
  ref,
) {
  const s = sizeMap[size]
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40',
        s.box,
        variantMap[variant],
        active && 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white',
        className,
      )}
      {...props}
    >
      <Icon className={s.icon} aria-hidden="true" />
      {typeof badge === 'number' && badge > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : badge === true ? (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
      ) : null}
    </button>
  )
})
