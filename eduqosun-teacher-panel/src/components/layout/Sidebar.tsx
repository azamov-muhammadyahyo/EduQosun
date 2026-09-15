import { useState } from 'react'
import { GraduationCap, Sprout, X } from 'lucide-react'
import { primaryNav, secondaryNav } from '../../data/navigation'
import type { NavItem } from '../../types'

interface SidebarProps {
  open: boolean
  onClose: () => void
  currentPage: string
  onNavigate: (id: string) => void
}

interface NavLinkProps {
  item: NavItem
  active: boolean
  onNavigate: (id: string) => void
}

function NavLink({ item, active, onNavigate }: NavLinkProps) {
  const Icon = item.icon
  return (
    <li>
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault()
          onNavigate(item.id)
        }}
        aria-current={active ? 'page' : undefined}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          active
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon
          className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
          aria-hidden="true"
        />
        {item.label}
      </a>
    </li>
  )
}

function PromoCard() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-4">
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-2 top-2 rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Eslatmani yopish"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
        <Sprout className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      <p className="mt-3 pr-4 text-sm font-semibold leading-snug text-white">
        Bugungi mehnat ertangi natija!
      </p>
    </div>
  )
}

export function Sidebar({ open, onClose, currentPage, onNavigate }: SidebarProps) {
  return (
    <>
      {/* Mobil overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Asosiy navigatsiya"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-white">EduQosun</p>
            <p className="truncate text-xs text-slate-400">Ta'lim – kelajak kaliti</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Menyuni yopish"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigatsiya */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {primaryNav.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                active={item.id === currentPage}
                onNavigate={onNavigate}
              />
            ))}
          </ul>

          <div className="my-3 border-t border-slate-700/60" />

          <ul className="space-y-1">
            {secondaryNav.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                active={item.id === currentPage}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </nav>

        {/* Pastdagi promo kartochka */}
        <div className="p-3">
          <PromoCard />
        </div>
      </aside>
    </>
  )
}
