import { useState, type FormEvent } from 'react'
import { CalendarCheck, ClipboardCheck, Eye, EyeOff, LogIn, Moon, Sun, Users } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { DEFAULT_PASSWORD } from '../store/appState'
import { useApp } from '../store/appStore'
import { login } from '../store/actions/account'
import { notify } from '../store/toastStore'
import { BrandName } from '../components/brand/Brand'
import { Button } from '../components/ui/Button'
import { Field, TextInput } from '../components/ui/Form'
import { IconButton } from '../components/ui/IconButton'

const features = [
  { icon: CalendarCheck, title: 'Darslar va davomat', text: 'Jadval, davomat va uy vazifalari bir joyda' },
  { icon: ClipboardCheck, title: 'Baholar jurnali', text: 'Topshiriq, test va baholar avtomatik hisoblanadi' },
  { icon: Users, title: "Guruh va o'quvchilar", text: "Har bir o'quvchi rivojini kuzatib boring" },
]

/** Tizimga kirish sahifasi */
export function LoginPage() {
  const { theme, toggleTheme } = useTheme()
  const savedLogin = useApp((s) => s.session.login)
  const customPassword = useApp((s) => s.session.passwordHash !== '')
  const [loginValue, setLoginValue] = useState(savedLogin)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!loginValue.trim() || !password) {
      setError('Login va parolni kiriting')
      return
    }
    setLoading(true)
    const ok = await login(loginValue, password)
    setLoading(false)
    if (!ok) {
      setError("Login yoki parol noto'g'ri")
      return
    }
    notify.success('Xush kelibsiz!', 'Tizimga muvaffaqiyatli kirdingiz.')
  }

  return (
    <div className="grid min-h-screen bg-canvas dark:bg-slate-900 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Chap: brend paneli */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-navy-900 via-navy-850 to-blue-900 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <BrandName inverted className="relative" />
        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-bold leading-tight">O'qituvchi uchun qulay va zamonaviy boshqaruv paneli</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Darslaringiz, guruhlaringiz va o'quvchilaringiz haqidagi barcha ma'lumotlar bitta joyda.
          </p>
          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-slate-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-xs text-slate-500">© {new Date().getFullYear()} EduQosun. Ta'lim – kelajak kaliti.</p>
      </aside>

      {/* O'ng: forma */}
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="absolute right-4 top-4">
          <IconButton
            icon={theme === 'dark' ? Sun : Moon}
            label={theme === 'dark' ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
            size="md"
            variant="outline"
            onClick={toggleTheme}
          />
        </div>
        <div className="w-full max-w-sm animate-fade-in">
          <BrandName className="mb-8 lg:hidden" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tizimga kirish</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">O'qituvchi hisobingiz ma'lumotlarini kiriting</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Field label="Telefon raqam yoki e-pochta" required>
              {(id) => (
                <TextInput
                  id={id}
                  value={loginValue}
                  autoComplete="username"
                  placeholder="+998 90 123 45 67"
                  invalid={!!error}
                  onChange={(event) => {
                    setLoginValue(event.target.value)
                    setError('')
                  }}
                />
              )}
            </Field>
            <Field label="Parol" required error={error}>
              {(id) => (
                <div className="relative">
                  <TextInput
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    invalid={!!error}
                    className="pr-10"
                    autoFocus
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setError('')
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              )}
            </Field>
            <Button type="submit" size="lg" icon={LogIn} loading={loading} fullWidth>
              Kirish
            </Button>
          </form>

          {customPassword ? null : (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-slate-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Demo hisob</p>
              <p className="mt-1">
                Login: <span className="font-medium">{savedLogin}</span> · Parol:{' '}
                <span className="font-mono font-medium">{DEFAULT_PASSWORD}</span>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
