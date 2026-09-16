import { Menu as MenuIcon, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { openPalette, setSidebarOpen } from '../../store/uiStore'
import { IconButton } from '../ui/IconButton'
import { Kbd } from '../ui/Misc'
import { ProfileMenu, ToolsMenu } from './topbar/AccountMenus'
import { CurrentLessonPill } from './topbar/CurrentLessonPill'
import { NotificationsMenu } from './topbar/NotificationsMenu'

export function Topbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="print-hidden sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/85">
      <div className="mx-auto flex h-[68px] max-w-[1680px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <IconButton
          icon={MenuIcon}
          label="Menyuni ochish"
          size="md"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />

        {/* Qidiruv — bosilganda buyruqlar paneli ochiladi (Ctrl + K) */}
        <button
          type="button"
          onClick={openPalette}
          className="group flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-400 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 sm:max-w-md xl:max-w-lg 2xl:max-w-xl"
          aria-label="Qidiruv (Ctrl + K)"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-500" aria-hidden="true" />
          <span className="flex-1 truncate">O'quvchi, guruh yoki darsni qidirish...</span>
          <span className="hidden items-center gap-1 sm:flex">
            <Kbd>Ctrl</Kbd>
            <span className="text-[11px] text-slate-400">+</span>
            <Kbd>K</Kbd>
          </span>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <CurrentLessonPill className="mr-2 hidden max-w-[300px] xl:inline-flex" />
          <ToolsMenu />
          <NotificationsMenu />
          <IconButton
            icon={theme === 'dark' ? Sun : Moon}
            label={theme === 'dark' ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
            size="md"
            onClick={toggleTheme}
          />
          <div className="mx-1 hidden h-8 w-px bg-slate-200 dark:bg-slate-700 sm:block" aria-hidden="true" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
