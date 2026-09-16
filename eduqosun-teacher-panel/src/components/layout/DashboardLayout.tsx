import type { ReactNode } from 'react'
import type { PageId } from '../../types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardLayoutProps {
  currentPage: PageId | 'not-found'
  children: ReactNode
}

/** Umumiy sahifa tuzilishi: qotirilgan sidebar + topbar + asosiy kontent */
export function DashboardLayout({ currentPage, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Asosiy kontentga o'tish
      </a>
      <Sidebar currentPage={currentPage} />
      <div className="print-full lg:pl-60">
        <Topbar />
        <main id="main-content" tabIndex={-1} className="print-full mx-auto max-w-[1680px] px-4 py-6 outline-none sm:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
