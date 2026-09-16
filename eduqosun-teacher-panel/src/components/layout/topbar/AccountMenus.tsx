import { ChevronDown, Keyboard, LogOut, Settings, Shuffle, Split, Timer, UserRound, WandSparkles } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { navigateTo } from '../../../router'
import { useProfile, useTeacherName } from '../../../hooks/useData'
import { logout } from '../../../store/actions/account'
import { confirmAction, openModal } from '../../../store/uiStore'
import { notify } from '../../../store/toastStore'
import { Avatar } from '../../ui/Avatar'
import { Menu } from '../../ui/Menu'

/** O'qituvchi uchun sinf vositalari: tasodifiy o'quvchi, taymer, jamoalarga bo'lish */
export function ToolsMenu() {
  return (
    <Menu
      label="Ustoz asboblari"
      items={[
        { id: 'random', label: "Tasodifiy o'quvchi", icon: Shuffle, hint: 'R', onSelect: () => openModal({ type: 'random-picker' }) },
        { id: 'timer', label: 'Dars taymeri', icon: Timer, hint: 'T', onSelect: () => openModal({ type: 'timer' }) },
        { id: 'teams', label: "Jamoalarga bo'lish", icon: Split, onSelect: () => openModal({ type: 'team-splitter' }) },
        {
          id: 'shortcuts',
          label: 'Klaviatura yorliqlari',
          icon: Keyboard,
          hint: '?',
          divider: true,
          onSelect: () => openModal({ type: 'shortcuts' }),
        },
      ]}
      trigger={({ open, toggle, ref, id }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          aria-label="Ustoz asboblari"
          title="Ustoz asboblari"
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-white',
            open && 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white',
          )}
        >
          <WandSparkles className="h-5 w-5" aria-hidden="true" />
          <span className="hidden text-sm font-medium 2xl:inline">Asboblar</span>
        </button>
      )}
    />
  )
}

export function ProfileMenu() {
  const profile = useProfile()
  const name = useTeacherName()

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: 'Tizimdan chiqish',
      message: "Hisobingizdan chiqmoqchimisiz? Ma'lumotlaringiz shu qurilmada saqlanib qoladi.",
      confirmLabel: 'Chiqish',
    })
    if (ok) {
      logout()
      notify.info('Tizimdan chiqdingiz', "Qayta kirish uchun login va parolingizni kiriting.")
    }
  }

  return (
    <Menu
      label="Profil menyusi"
      items={[
        { id: 'profile', label: 'Mening profilim', icon: UserRound, onSelect: () => navigateTo('settings', null, { tab: 'profile' }) },
        { id: 'settings', label: 'Sozlamalar', icon: Settings, onSelect: () => navigateTo('settings') },
        { id: 'shortcuts', label: 'Klaviatura yorliqlari', icon: Keyboard, onSelect: () => openModal({ type: 'shortcuts' }) },
        { id: 'logout', label: 'Chiqish', icon: LogOut, tone: 'danger', divider: true, onSelect: () => void handleLogout() },
      ]}
      trigger={({ open, toggle, ref, id }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          aria-label="Profil menyusi"
          className={cn(
            'flex items-center gap-2.5 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/60',
            open && 'bg-slate-100 dark:bg-slate-700/60',
          )}
        >
          <Avatar name={`${profile.firstName} ${profile.lastName}`} color={profile.color} size="md" variant="solid" />
          <span className="hidden min-w-0 text-left leading-tight md:block">
            <span className="block max-w-[160px] truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{name}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">O'qituvchi</span>
          </span>
          <ChevronDown
            className={cn('hidden h-4 w-4 text-slate-400 transition-transform md:block', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      )}
    />
  )
}
