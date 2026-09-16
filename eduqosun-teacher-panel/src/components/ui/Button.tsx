import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'danger' | 'danger-soft' | 'success'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  loading?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 active:bg-blue-800',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60',
  outline:
    'border border-blue-200 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-500/30 dark:bg-transparent dark:text-blue-400 dark:hover:bg-blue-500/10',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white',
  soft: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20',
  danger: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700',
  'danger-soft': 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20',
  success: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700',
}

const sizes: Record<ButtonSize, { button: string; icon: string }> = {
  xs: { button: 'h-7 gap-1 rounded-md px-2 text-xs', icon: 'h-3.5 w-3.5' },
  sm: { button: 'h-8 gap-1.5 rounded-lg px-3 text-xs', icon: 'h-3.5 w-3.5' },
  md: { button: 'h-10 gap-2 rounded-lg px-4 text-sm', icon: 'h-4 w-4' },
  lg: { button: 'h-11 gap-2 rounded-xl px-5 text-sm', icon: 'h-4 w-4' },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const s = sizes[size]
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900',
        variants[variant],
        s.button,
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn(s.icon, 'shrink-0 animate-spin')} aria-hidden="true" />
      ) : Icon ? (
        <Icon className={cn(s.icon, 'shrink-0')} aria-hidden="true" />
      ) : null}
      {children}
      {IconRight && !loading ? <IconRight className={cn(s.icon, 'shrink-0')} aria-hidden="true" /> : null}
    </button>
  )
})
