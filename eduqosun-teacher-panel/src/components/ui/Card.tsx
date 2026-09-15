import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Asosiy kartochka: rounded-2xl, yumshoq ramka + soya (§5.3) */
export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
