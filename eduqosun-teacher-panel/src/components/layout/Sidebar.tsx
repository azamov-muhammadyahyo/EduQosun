import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { NavItem, PageId } from '../../types'
import { primaryNav, secondaryNav } from '../../data/navigation'
import { quotes } from '../../data/catalog'
import { cn } from '../../lib/cn'
import { todayKey } from '../../lib/date'
import { navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { updateSettings } from '../../store/actions/account'
import { useClock } from '../../store/clock'
import { selectUnreadMessages } from '../../store/selectors'
import { setSidebarOpen, useUI } from '../../store/uiStore'
import { BrandName, PlantIllustration } from '../brand/Brand'

interface SidebarProps {
  currentPage: PageId | 'not-found'
}

interface NavLinkProps {
  item: NavItem
  active: boolean
  badge?: { value: number; tone: 'rose' | 'amber' }
}

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
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
          active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
            : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
        )}
      >
        <Icon
          className={cn('h-5 w-5 shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-white')}
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <span className="flex-1 truncate">{item.label}</span>
        {badge && badge.value > 0 ? (
          <span
            className={cn(
              'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums',
              active ? 'bg-white text-blue-700' : badge.tone === 'rose' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-amber-950',
            )}
          >
            {badge.value > 99 ? '99+' : badge.value}
          </span>
        ) : null}
      </a>
    </li>
  )
}

function PromoCard() {
  const visible = useApp((s) => s.settings.showPromo)
  // Har kuni boshqa iqtibos; bosilganda keyingisiga o'tadi
  const [offset, setOffset] = useState(0)
  const dayIndex = useMemo(() => Number(todayKey().slice(8, 10)), [])
  if (!visible) return null
  const quote = quotes[(dayIndex + offset) % quotes.length]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-navy-800 to-navy-850 p-4 pr-16">
      <button
        type="button"
        onClick={() => updateSettings({ showPromo: false })}
        className="absolute right-2 top-2 z-10 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Kartochkani yopish"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setOffset((value) => value + 1)}
        className="text-left"
        title="Keyingi iqtibos"
      >
        <p className="text-sm font-semibold leading-snug text-white">{quote.title}</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{quote.subtitle}</p>
      </button>
      <PlantIllustration className="pointer-events-none absolute -bottom-1 right-2 h-20 w-14" />
    </div>
  )
}

export function Sidebar({ currentPage }: SidebarProps) {
  const open = useUI((s) => s.sidebarOpen)
  const unread = useApp(selectUnreadMessages)
  const reminders = useApp((s) => s.reminders)
  const { today } = useClock()
  const dueReminders = useMemo(
    () => reminders.filter((r) => !r.done && r.date <= today).length,
    [reminders, today],
  )

  const badges: Partial<Record<PageId, NavLinkProps['badge']>> = {
    messages: { value: unread, tone: 'rose' },
    reminders: { value: dueReminders, tone: 'amber' },
  }

  return (
    <>
      {/* Mobil overlay */}
      <div
        className={cn(
          'print-hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'print-hidden fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-gradient-to-b from-navy-900 via-navy-900 to-navy-950 transition-transform duration-300 ease-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Asosiy navigatsiya"
      >
        <div className="flex items-center gap-2 px-4 pb-4 pt-5">
          <a
            href="#home"
            onClick={(event) => {
              event.preventDefault()
              navigateTo('home')
              setSidebarOpen(false)
            }}
            className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <BrandName inverted />
          </a>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Menyuni yopish"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="scrollbar-navy flex-1 overflow-y-auto px-3 py-1">
          <ul className="space-y-1">
            {primaryNav.map((item) => (
              <NavLink key={item.id} item={item} active={item.id === currentPage} badge={badges[item.id]} />
            ))}
          </ul>

          <div className="mx-2 my-3 border-t border-white/10" />

          <ul className="space-y-1">
            {secondaryNav.map((item) => (
              <NavLink key={item.id} item={item} active={item.id === currentPage} />
            ))}
          </ul>
        </nav>

        <div className="p-3">
          <PromoCard />
        </div>
      </aside>
    </>
  )
}
