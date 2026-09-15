import { Bell, ChevronDown, Menu, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { teacher } from '../../data/teacher'
import { Avatar } from '../ui/Avatar'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/80 sm:gap-3 sm:px-6 lg:px-8">
      {/* Mobil menyu tugmasi */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        aria-label="Menyuni ochish"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Qidiruv */}
      <div className="relative min-w-0 flex-1 sm:max-w-md lg:max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Qidiruv"
          placeholder="O'quvchi, guruh yoki darsni qidirish..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-16 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:inline-flex">
          Ctrl + K
        </kbd>
      </div>

      {/* O'ng taraf */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Bildirishnomalar, o'qilmagan xabar bor"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label={theme === 'dark' ? 'Kunduzgi rejimga o‘tish' : 'Tungi rejimga o‘tish'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Profil menyusi"
        >
          <Avatar initials={teacher.initials} color="blue" size="sm" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
              {teacher.fullName}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{teacher.role}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
