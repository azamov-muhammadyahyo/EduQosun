import { Bell, Database, Palette, Settings, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'
import { updateQuery, useRoute } from '../router'
import { DataSettings, SecuritySettings } from '../components/settings/AccountSettings'
import { AppearanceSettings, NotificationSettings } from '../components/settings/PreferenceSettings'
import { ProfileSettings } from '../components/settings/ProfileSettings'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

type Tab = 'profile' | 'notifications' | 'appearance' | 'security' | 'data'

const tabs: { value: Tab; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'profile', label: 'Profil', description: "Shaxsiy ma'lumotlar", icon: UserRound },
  { value: 'notifications', label: 'Bildirishnomalar', description: 'Xabar va eslatmalar', icon: Bell },
  { value: 'appearance', label: "Ko'rinish", description: "Mavzu va o'quv jarayoni", icon: Palette },
  { value: 'security', label: 'Xavfsizlik', description: 'Parol va seans', icon: ShieldCheck },
  { value: 'data', label: "Ma'lumotlar", description: 'Zaxira va tiklash', icon: Database },
]

export function SettingsPage() {
  const { query } = useRoute()
  const requested = query.get('tab') as Tab | null
  const tab: Tab = tabs.some((t) => t.value === requested) ? (requested as Tab) : 'profile'

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Sozlamalar" description="Profil, bildirishnomalar, ko'rinish va ma'lumotlarni boshqarish" icon={Settings} />

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit p-2 lg:sticky lg:top-[88px]">
          <nav aria-label="Sozlamalar bo'limlari">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col">
              {tabs.map(({ value, label, description, icon: Icon }) => {
                const active = value === tab
                return (
                  <li key={value} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuery({ tab: value === 'profile' ? null : value })}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        active ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/40',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block whitespace-nowrap text-sm font-semibold">{label}</span>
                        <span className="hidden text-xs text-slate-500 dark:text-slate-400 lg:block">{description}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </Card>

        <div className="min-w-0 max-w-4xl">
          {tab === 'profile' ? <ProfileSettings /> : null}
          {tab === 'notifications' ? <NotificationSettings /> : null}
          {tab === 'appearance' ? <AppearanceSettings /> : null}
          {tab === 'security' ? <SecuritySettings /> : null}
          {tab === 'data' ? <DataSettings /> : null}
        </div>
      </div>
    </div>
  )
}
