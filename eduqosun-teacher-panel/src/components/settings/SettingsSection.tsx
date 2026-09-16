import type { ReactNode } from 'react'
import { Card } from '../ui/Card'

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

/** Sozlamalar bo'limi kartasi: sarlavha, tarkib va (ixtiyoriy) pastki tugmalar */
export function SettingsSection({ title, description, children, footer }: SettingsSectionProps) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700/60 sm:px-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-700/60 dark:bg-slate-900/30 sm:px-6">
          {footer}
        </div>
      ) : null}
    </Card>
  )
}
