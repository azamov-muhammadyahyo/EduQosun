import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Asosiy kartochka: rounded-2xl, yumshoq ramka + soya */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ children, className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'print-plain rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-700/60 dark:bg-slate-800',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
