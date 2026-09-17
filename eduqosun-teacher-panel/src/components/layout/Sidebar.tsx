import { useMemo, useState, type ReactNode } from 'react'
import { GraduationCap, Sparkles, X } from 'lucide-react'
import type { NavItem, PageId } from '../../types'
import { primaryNav, secondaryNav } from '../../data/navigation'
import { sidebarQuotes } from '../../data/catalog'
import { cn } from '../../lib/cn'
import { navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { updateSettings } from '../../store/actions/account'
import { useClock } from '../../store/clock'
import { selectUnreadMessages } from '../../store/selectors'
import { setSidebarOpen, useUI } from '../../store/uiStore'

interface SidebarProps {
  currentPage: PageId | 'not-found'
}

interface NavLinkProps {
  item: NavItem
  active: boolean
  badge?: { value: number; tone: 'rose' | 'amber' }
}

/**
 * Menyu qatori:
 *  - oddiy holat — kulrang ikonka va matn
 *  - ustiga borganda — och kulrang fon, to'q matn
 *  - aktiv — och ko'k fon, chap tomonda ko'k chiziq, ko'k ikonka
 */
function NavLink({ item, active, badge }: NavLinkProps) {
  const Icon = item.icon
  return (
    <li>
      <a
        href={`#${item.id}`}
        onClick={(event) => {
          event.preventDefault()
          navigateTo(item.id)
          setSidebarOpen(false)
        }}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60',
          active
            ? 'bg-blue-50 font-semibold text-slate-900 dark:bg-blue-500/15 dark:text-white'
            : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        )}
      >
        {/* Aktiv bo'lim belgisi — band ichida, chap chetiga yopishgan ko'k chiziq */}
        <span
          className={cn(
            'absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-blue-600 transition-all duration-200 dark:bg-blue-400',
            active ? 'opacity-100' : 'scale-y-0 opacity-0',
          )}
          aria-hidden="true"
        />
        <Icon
          className={cn(
            'h-5 w-5 shrink-0 transition-colors',
            active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200',
          )}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <span className="flex-1 truncate">{item.label}</span>
        {badge && badge.value > 0 ? (
          <span
            className={cn(
              'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums',
              badge.tone === 'rose'
                ? 'bg-rose-500 text-white'
                : 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
            )}
          >
            {badge.value > 99 ? '99+' : badge.value}
          </span>
        ) : null}
      </a>
    </li>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 mt-1 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
      {children}
    </p>
  )
}

/** Logotip: ko'k plitka ichida bitiruvchi qalpog'i */
function SidebarBrand() {
  return (
    <a
      href="#home"
      onClick={(event) => {
        event.preventDefault()
        navigateTo('home')
        setSidebarOpen(false)
      }}
      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-600/25">
        <GraduationCap className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">EduQosun</span>
        <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">Ta'lim – kelajak kaliti</span>
      </span>
    </a>
  )
}

/** Pastdagi iqtibos kartasi: bosilsa keyingi iqtibos, "×" — yashirish */
function QuoteCard() {
  const visible = useApp((s) => s.settings.showPromo)
  const [index, setIndex] = useState(0)
  if (!visible) return null
  const quote = sidebarQuotes[index % sidebarQuotes.length]

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
      <button
        type="button"
        onClick={() => updateSettings({ showPromo: false })}
        className="absolute right-1.5 top-1.5 rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        aria-label="Iqtibosni yashirish"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <button
        type="button"
        onClick={() => setIndex((value) => value + 1)}
        className="mt-2 block pr-3 text-left text-[13px] font-medium leading-snug text-slate-700 transition-colors hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300"
        title="Keyingi iqtibos"
      >
        {quote}
      </button>
    </div>
  )
}

export function Sidebar({ currentPage }: SidebarProps) {
  const open = useUI((s) => s.sidebarOpen)
  const unread = useApp(selectUnreadMessages)
  const reminders = useApp((s) => s.reminders)
  const { today } = useClock()
  const dueReminders = useMemo(() => reminders.filter((r) => !r.done && r.date <= today).length, [reminders, today])

  const badges: Partial<Record<PageId, NavLinkProps['badge']>> = {
    messages: { value: unread, tone: 'rose' },
    reminders: { value: dueReminders, tone: 'amber' },
  }

  return (
    <>
      {/* Mobil overlay */}
      <div
        className={cn(
          'print-hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'print-hidden fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0',
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
        aria-label="Asosiy navigatsiya"
      >
        <div className="flex h-[68px] shrink-0 items-center gap-2 border-b border-slate-100 pl-5 pr-4 dark:border-slate-800">
          <SidebarBrand />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
            aria-label="Menyuni yopish"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto pl-5 pr-3 py-5">
          <SectionLabel>Umumiy</SectionLabel>
          <ul className="space-y-1">
            {primaryNav.map((item) => (
              <NavLink key={item.id} item={item} active={item.id === currentPage} badge={badges[item.id]} />
            ))}
          </ul>

          <div className="my-5 h-px bg-slate-100 dark:bg-slate-800" aria-hidden="true" />

          <SectionLabel>Tizim</SectionLabel>
          <ul className="space-y-1">
            {secondaryNav.map((item) => (
              <NavLink key={item.id} item={item} active={item.id === currentPage} />
            ))}
          </ul>
        </nav>

        <div className="py-3 pl-5 pr-3">
          <QuoteCard />
        </div>
      </aside>
    </>
  )
}
