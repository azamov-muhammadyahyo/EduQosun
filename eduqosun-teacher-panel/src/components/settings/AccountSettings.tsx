import { useRef, useState } from 'react'
import { Database, Download, KeyRound, LogOut, RotateCcw, ShieldCheck, Upload } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatDateTime, todayKey } from '../../lib/date'
import { downloadFile, readFileAsText } from '../../lib/download'
import { formatBytes } from '../../lib/format'
import { passwordStrength } from '../../lib/hash'
import { useApp } from '../../store/appStore'
import { STORAGE_KEY } from '../../store/appState'
import { changePassword, exportData, importData, logout, resetDemoData } from '../../store/actions/account'
import { notify } from '../../store/toastStore'
import { confirmAction } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Field, TextInput } from '../ui/Form'
import { InfoRow } from '../ui/Misc'
import { SettingsSection } from './SettingsSection'

const strengthMeta = [
  { label: 'Juda zaif', bar: 'bg-rose-500' },
  { label: 'Zaif', bar: 'bg-orange-500' },
  { label: "O'rtacha", bar: 'bg-amber-500' },
  { label: 'Yaxshi', bar: 'bg-blue-500' },
  { label: 'Kuchli', bar: 'bg-emerald-500' },
]

const MIN_PASSWORD = 6

/** Parolni almashtirish va seans ma'lumotlari */
export function SecuritySettings() {
  const session = useApp((s) => s.session)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const strength = passwordStrength(next)

  const submit = async () => {
    if (next.length < MIN_PASSWORD) return setError(`Yangi parol kamida ${MIN_PASSWORD} ta belgidan iborat bo'lsin`)
    if (next !== confirm) return setError('Parollar mos kelmadi')
    if (next === current) return setError("Yangi parol eskisidan farq qilishi kerak")
    setLoading(true)
    const ok = await changePassword(current, next)
    setLoading(false)
    if (!ok) return setError("Joriy parol noto'g'ri")
    setError('')
    setCurrent('')
    setNext('')
    setConfirm('')
    notify.success("Parol o'zgartirildi", 'Keyingi kirishda yangi paroldan foydalaning.')
  }

  const signOut = async () => {
    const ok = await confirmAction({
      title: 'Tizimdan chiqish',
      message: "Hisobingizdan chiqmoqchimisiz? Ma'lumotlaringiz shu qurilmada saqlanib qoladi.",
      confirmLabel: 'Chiqish',
    })
    if (ok) logout()
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Parolni o'zgartirish"
        description="Hisobingiz xavfsizligi uchun kuchli paroldan foydalaning"
        footer={
          <Button icon={KeyRound} loading={loading} disabled={!current || !next || !confirm} onClick={() => void submit()}>
            Parolni yangilash
          </Button>
        }
      >
        <form
          className="grid max-w-md gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <Field label="Joriy parol" required>
            {(id) => <TextInput id={id} type="password" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); setError('') }} />}
          </Field>
          <Field label="Yangi parol" required>
            {(id) => <TextInput id={id} type="password" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError('') }} />}
          </Field>
          {next ? (
            <div>
              <div className="flex gap-1" aria-hidden="true">
                {strengthMeta.slice(1).map((item, index) => (
                  <span key={item.label} className={cn('h-1.5 flex-1 rounded-full', index < strength ? strengthMeta[strength].bar : 'bg-slate-200 dark:bg-slate-700')} />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Parol ishonchliligi: {strengthMeta[strength].label}</p>
            </div>
          ) : null}
          <Field label="Yangi parolni tasdiqlang" required error={error}>
            {(id) => (
              <TextInput id={id} type="password" autoComplete="new-password" value={confirm} invalid={!!error} onChange={(e) => { setConfirm(e.target.value); setError('') }} />
            )}
          </Field>
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </SettingsSection>

      <SettingsSection title="Seans" description="Joriy kirish haqida ma'lumot">
        <div className="max-w-md divide-y divide-slate-100 dark:divide-slate-700/60">
          <InfoRow label="Login" value={session.login} />
          <InfoRow label="Oxirgi kirish" value={session.lastLoginAt ? formatDateTime(session.lastLoginAt) : '—'} />
          <InfoRow label="Parol o'zgartirilgan" value={session.passwordChangedAt ? formatDateTime(session.passwordChangedAt) : 'Standart parol'} />
        </div>
        <Button className="mt-4" variant="danger-soft" icon={LogOut} onClick={() => void signOut()}>
          Tizimdan chiqish
        </Button>
      </SettingsSection>
    </div>
  )
}

/** Zaxira nusxa, tiklash va demo ma'lumotlarni qayta yaratish */
export function DataSettings() {
  const state = useApp((s) => s)
  const fileRef = useRef<HTMLInputElement>(null)
  const size = new Blob([JSON.stringify(state)]).size

  const counts = [
    { label: 'Guruhlar', value: state.groups.length },
    { label: "O'quvchilar", value: state.students.length },
    { label: 'Davomat yozuvlari', value: Object.keys(state.attendance).length },
    { label: 'Topshiriqlar', value: state.assignments.length },
    { label: 'Testlar', value: state.tests.length },
    { label: 'Suhbatlar', value: state.conversations.length },
  ]

  const backup = () => {
    downloadFile(`eduqosun-zaxira-${todayKey()}.json`, exportData(), 'application/json')
    notify.success('Zaxira nusxa yuklab olindi', "Faylni xavfsiz joyda saqlang.")
  }

  const restore = async (file: File) => {
    const ok = await confirmAction({
      title: "Ma'lumotlarni tiklash",
      message: `«${file.name}» faylidagi ma'lumotlar joriy ma'lumotlar o'rniga yoziladi. Davom etasizmi?`,
      confirmLabel: 'Tiklash',
      tone: 'primary',
    })
    if (!ok) return
    try {
      const text = await readFileAsText(file)
      if (importData(text)) notify.success("Ma'lumotlar tiklandi", file.name)
      else notify.error("Fayl mos emas", "Bu EduQosun zaxira fayli emas yoki versiyasi eskirgan.")
    } catch {
      notify.error("Faylni o'qib bo'lmadi")
    }
  }

  const reset = async () => {
    const ok = await confirmAction({
      title: "Demo ma'lumotlarni qayta yaratish",
      message: "Barcha guruh, o'quvchi, davomat va baholar o'chirilib, yangi demo ma'lumotlar yaratiladi. Avval zaxira nusxa olishni tavsiya qilamiz.",
      confirmLabel: 'Qayta yaratish',
    })
    if (!ok) return
    resetDemoData()
    notify.success("Ma'lumotlar yangilandi", "Demo ma'lumotlar qaytadan yaratildi.")
  }

  return (
    <SettingsSection title="Ma'lumotlar" description="Barcha ma'lumotlar shu brauzerda saqlanadi">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {counts.map((item) => (
          <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Database className="h-3.5 w-3.5" aria-hidden="true" />
        Egallangan joy: {formatBytes(size)} · kalit: <code className="font-mono">{STORAGE_KEY}</code>
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Zaxira nusxa</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Barcha ma'lumotlarni JSON faylga yuklab olish</p>
          <Button className="mt-3" size="sm" variant="secondary" onClick={backup}>
            Yuklab olish
          </Button>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Tiklash</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Avval saqlangan zaxira fayldan qayta yuklash</p>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
            Fayl tanlash
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void restore(file)
            }}
          />
        </div>
        <div className="rounded-xl border border-rose-200 p-4 dark:border-rose-500/30">
          <RotateCcw className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Demo ma'lumotlar</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Hammasini o'chirib, namunaviy ma'lumot yaratish</p>
          <Button className="mt-3" size="sm" variant="danger-soft" onClick={() => void reset()}>
            Qayta yaratish
          </Button>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Ma'lumotlar serverga yuborilmaydi va faqat shu qurilmada saqlanadi. Boshqa kompyuterda ishlash uchun zaxira nusxadan foydalaning.
      </p>
    </SettingsSection>
  )
}
