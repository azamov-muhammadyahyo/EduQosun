import { Laptop, Moon, Sun, Volume2, type LucideIcon } from 'lucide-react'
import { lessonDurations } from '../../data/catalog'
import { cn } from '../../lib/cn'
import { formatDuration } from '../../lib/date'
import { playChime } from '../../lib/sound'
import { useTheme, type ThemePreference } from '../../context/ThemeContext'
import { useSettings } from '../../hooks/useData'
import { updateSettings } from '../../store/actions/account'
import { Button } from '../ui/Button'
import { Field, Select, Switch } from '../ui/Form'
import { SettingsSection } from './SettingsSection'

/** Bildirishnomalar va ogohlantirishlar */
export function NotificationSettings() {
  const settings = useSettings()
  return (
    <SettingsSection title="Bildirishnomalar" description="Qaysi hodisalar haqida xabar olishni tanlang">
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        <Switch
          className="pb-4"
          label="Yangi xabarlar"
          description="O'quvchi yoki ota-onadan xabar kelganda"
          checked={settings.notifyMessages}
          onChange={(value) => updateSettings({ notifyMessages: value })}
        />
        <Switch
          className="py-4"
          label="Topshirilgan javoblar"
          description="O'quvchi topshiriqni yuborganda"
          checked={settings.notifySubmissions}
          onChange={(value) => updateSettings({ notifySubmissions: value })}
        />
        <Switch
          className="py-4"
          label="Eslatmalar"
          description="Eslatma vaqtidan 15 daqiqa oldin ogohlantirish"
          checked={settings.notifyReminders}
          onChange={(value) => updateSettings({ notifyReminders: value })}
        />
        <div className="py-4">
          <Switch
            label="Dars boshlanishi haqida"
            description="Dars boshlanishidan oldin ekranda eslatma chiqadi"
            checked={settings.lessonReminder}
            onChange={(value) => updateSettings({ lessonReminder: value })}
          />
          {settings.lessonReminder ? (
            <Field label="Qancha oldin eslatilsin" className="mt-3 max-w-xs">
              {(id) => (
                <Select
                  id={id}
                  value={String(settings.lessonReminderMinutes)}
                  onChange={(value) => updateSettings({ lessonReminderMinutes: Number(value) })}
                  options={[5, 10, 15, 30].map((m) => ({ value: String(m), label: `${m} daqiqa oldin` }))}
                />
              )}
            </Field>
          ) : null}
        </div>
        <div className="py-4">
          <Switch
            label="Ovozli signal"
            description="Bildirishnoma va taymer tugaganda qisqa ovoz"
            checked={settings.sound}
            onChange={(value) => updateSettings({ sound: value })}
          />
          <Button className="mt-3" size="sm" variant="secondary" icon={Volume2} disabled={!settings.sound} onClick={() => playChime('notify')}>
            Ovozni sinab ko'rish
          </Button>
        </div>
        <Switch
          className="pt-4"
          label="Haftalik hisobot"
          description="Har dushanba o'tgan hafta natijalari bo'yicha qisqa xulosa"
          checked={settings.weeklyReport}
          onChange={(value) => updateSettings({ weeklyReport: value })}
        />
      </div>
    </SettingsSection>
  )
}

const themes: { value: ThemePreference; label: string; icon: LucideIcon; preview: string }[] = [
  { value: 'light', label: "Yorug'", icon: Sun, preview: 'bg-slate-100' },
  { value: 'dark', label: "Qorong'i", icon: Moon, preview: 'bg-slate-800' },
  { value: 'system', label: 'Tizim', icon: Laptop, preview: 'bg-gradient-to-r from-slate-100 to-slate-800' },
]

/** Ko'rinish va o'quv jarayoni sozlamalari */
export function AppearanceSettings() {
  const { preference, setPreference } = useTheme()
  const settings = useSettings()

  return (
    <div className="space-y-6">
      <SettingsSection title="Ko'rinish" description="Mavzu va interfeys harakatlari">
        <div role="radiogroup" aria-label="Mavzu" className="grid gap-3 sm:grid-cols-3">
          {themes.map(({ value, label, icon: Icon, preview }) => {
            const active = preference === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPreference(value)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all',
                  active
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                )}
              >
                <span className={cn('block h-16 rounded-lg border border-slate-200 dark:border-slate-700', preview)} aria-hidden="true" />
                <span className="mt-2.5 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-700/60 dark:border-slate-700/60">
          <Switch
            className="py-4"
            label="Harakatlarni kamaytirish"
            description="Animatsiya va o'tishlar o'chiriladi"
            checked={settings.reduceMotion}
            onChange={(value) => updateSettings({ reduceMotion: value })}
          />
          <Switch
            className="pt-4"
            label="Menyudagi iqtibos kartasi"
            description="Chap menyuning pastidagi ilhomlantiruvchi karta"
            checked={settings.showPromo}
            onChange={(value) => updateSettings({ showPromo: value })}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="O'quv jarayoni" description="Yangi darslar uchun standart qiymatlar">
        <Field label="Dars davomiyligi" hint="Yangi dars yoki guruh jadvali yaratilganda qo'llanadi" className="max-w-xs">
          {(id) => (
            <Select
              id={id}
              value={String(settings.defaultLessonMinutes)}
              onChange={(value) => updateSettings({ defaultLessonMinutes: Number(value) })}
              options={lessonDurations.map((m) => ({ value: String(m), label: formatDuration(m) }))}
            />
          )}
        </Field>
      </SettingsSection>
    </div>
  )
}
