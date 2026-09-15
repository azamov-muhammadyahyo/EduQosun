import type { ButtonHTMLAttributes } from 'react'

interface SeeAllLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
}

/** Bo'lim sarlavhasi o'ngidagi "Barchasi" / "Barcha darslar" havolasi */
export function SeeAllLink({ label = 'Barchasi', className = '', ...props }: SeeAllLinkProps) {
  return (
    <button
      type="button"
      className={`rounded-md px-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 ${className}`}
      {...props}
    >
      {label}
    </button>
  )
}
