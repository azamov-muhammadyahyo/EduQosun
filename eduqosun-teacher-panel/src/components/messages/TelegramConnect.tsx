import { useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, LogOut, MessageSquareCode, RefreshCw, Send, ServerOff, ShieldCheck, Smartphone } from 'lucide-react'
import { errorMessage } from '../../api/http'
import { telegramApi } from '../../api/telegram'
import { cn } from '../../lib/cn'
import { formatPhone } from '../../lib/format'
import { navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { refreshTelegramStatus, telegramAuth } from '../../store/actions/telegram'
import { useTelegram, type TelegramState } from '../../store/telegramStore'
import { notify } from '../../store/toastStore'
import { confirmAction, openModal } from '../../store/uiStore'
import { TelegramIcon } from '../brand/TelegramIcon'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Field, TextInput } from '../ui/Form'
import { Modal } from '../ui/Modal'

const selectAll = (state: TelegramState) => state

/* ———————————— Server va sozlama ogohlantirishlari ———————————— */

function Callout({ tone, icon: Icon, title, children }: { tone: 'amber' | 'rose' | 'sky'; icon: typeof ServerOff; title: string; children: ReactNode }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100',
    sky: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100',
  }
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', tones[tone])}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <div className="mt-1 space-y-2 text-[13px] leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  )
}

export function ServerOfflineNotice() {
  const [checking, setChecking] = useState(false)
  return (
    <Callout tone="rose" icon={ServerOff} title="Telegram serveri ishlamayapti">
      <p>
        Loyiha papkasida terminal oching va <code className="rounded bg-white/60 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-900/60">npm run server</code> buyrug'ini
        ishga tushiring.
      </p>
      <Button
        size="sm"
        variant="secondary"
        icon={RefreshCw}
        loading={checking}
        onClick={async () => {
          setChecking(true)
          await refreshTelegramStatus()
          setChecking(false)
        }}
      >
        Qayta tekshirish
      </Button>
    </Callout>
  )
}

export function SetupInstructions() {
  return (
    <Callout tone="amber" icon={KeyRound} title="Telegram kalitlari kiritilmagan">
      <ol className="list-decimal space-y-1.5 pl-4">
        <li>
          <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="font-medium underline">
            my.telegram.org
          </a>{' '}
          saytiga telefon raqamingiz bilan kiring → <b>API development tools</b>.
        </li>
        <li>
          Ilova yarating: <i>App title</i> — EduQosun, <i>Short name</i> — eduqosun, <i>Platform</i> — Desktop.
        </li>
        <li>
          <code className="rounded bg-white/60 px-1 font-mono text-xs dark:bg-slate-900/60">eduqosun-server/.env.example</code> faylidan{' '}
          <code className="rounded bg-white/60 px-1 font-mono text-xs dark:bg-slate-900/60">.env</code> nusxasini oching va <b>TG_API_ID</b>, <b>TG_API_HASH</b> ni yozing.
        </li>
        <li>Serverni qayta ishga tushiring.</li>
      </ol>
      <p className="text-xs">Bu kalitlarni hech kimga bermang — ular faqat sizning kompyuteringizda saqlanadi.</p>
    </Callout>
  )
}

/** Telegram tayyor bo'lmasa — sababini va yechimini ko'rsatadi (tayyor bo'lsa hech narsa chizilmaydi) */
export function TelegramNotice({ compact = false }: { compact?: boolean }) {
  const { server, configured, auth } = useTelegram(selectAll)
  if (server === 'checking') return null
  if (server === 'offline') return <ServerOfflineNotice />
  if (!configured) return <SetupInstructions />
  if (auth === 'connected') return null
  return (
    <Callout tone="sky" icon={Send} title="Telegram akkauntingiz ulanmagan">
      {compact ? null : <p>Xabarlar sizning Telegram akkauntingiz nomidan yuboriladi. Avval akkauntni ulang.</p>}
      <Button size="sm" icon={Send} onClick={() => openModal({ type: 'telegram-connect' })}>
        Telegramni ulash
      </Button>
    </Callout>
  )
}

/* ———————————— Akkaunt kartasi ———————————— */

function AccountAvatar({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <Avatar name={name} color="sky" size="lg" />
  return <img src={telegramApi.accountPhotoUrl} alt="" onError={() => setFailed(true)} className="h-12 w-12 shrink-0 rounded-full object-cover" />
}

export function TelegramAccountCard({ action }: { action?: ReactNode }) {
  const account = useTelegram((s) => s.account)
  if (!account) return null
  const name = [account.firstName, account.lastName].filter(Boolean).join(' ')
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-700 dark:bg-slate-900/40">
      <AccountAvatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
          {name}
          {account.premium ? <Badge size="xs" color="violet">Premium</Badge> : null}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {[account.username ? `@${account.username}` : null, account.phone ? formatPhone(account.phone) : null].filter(Boolean).join(' · ')}
        </p>
      </div>
      <Badge color="green" dot>
        Ulangan
      </Badge>
      {action}
    </div>
  )
}

export function LogoutTelegramButton() {
  const [loading, setLoading] = useState(false)
  return (
    <Button
      variant="danger-soft"
      size="sm"
      icon={LogOut}
      loading={loading}
      onClick={async () => {
        const ok = await confirmAction({
          title: 'Telegramdan chiqish',
          message: "Panel sessiyasi Telegramda ham yopiladi. Ulangan chatlar saqlanib qoladi — shu akkaunt bilan qayta kirsangiz, ular yana ishlaydi.",
          confirmLabel: 'Chiqish',
        })
        if (!ok) return
        setLoading(true)
        try {
          await telegramAuth.logout()
          notify.info('Telegram akkaunti uzildi')
        } catch (error) {
          notify.error("Chiqib bo'lmadi", errorMessage(error))
        } finally {
          setLoading(false)
        }
      }}
    >
      Chiqish
    </Button>
  )
}

/* ———————————— Kirish bosqichlari ———————————— */

const steps = [
  { key: 'disconnected', label: 'Raqam', icon: Smartphone },
  { key: 'code', label: 'Kod', icon: MessageSquareCode },
  { key: 'password', label: 'Parol', icon: KeyRound },
] as const

function Steps({ current }: { current: string }) {
  const index = steps.findIndex((s) => s.key === current)
  return (
    <ol className="flex items-center gap-2" aria-label="Ulash bosqichlari">
      {steps.map((step, i) => {
        const done = i < index
        const active = i === index
        const Icon = done ? CheckCircle2 : step.icon
        return (
          <li key={step.key} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                active ? 'bg-blue-600 text-white' : done ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className={cn('truncate text-xs font-medium', active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400')}>
              {step.label}
              {step.key === 'password' ? <span className="font-normal text-slate-400"> (agar bo'lsa)</span> : null}
            </span>
            {i < steps.length - 1 ? <span className="hidden h-px flex-1 bg-slate-200 dark:bg-slate-700 sm:block" /> : null}
          </li>
        )
      })}
    </ol>
  )
}

/** Telefon → kod → parol. Ulangach `onDone` chaqiriladi */
export function TelegramConnectFlow({ onDone }: { onDone?: () => void }) {
  const state = useTelegram(selectAll)
  const profilePhone = useApp((s) => s.profile.phone)
  const [phone, setPhone] = useState(profilePhone)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async (task: () => Promise<void>) => {
    setError('')
    setLoading(true)
    try {
      await task()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (state.server === 'checking') {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Server tekshirilmoqda…
      </div>
    )
  }
  if (state.server === 'offline') return <ServerOfflineNotice />
  if (!state.configured) return <SetupInstructions />

  if (state.auth === 'connected') {
    return (
      <div className="space-y-4">
        <TelegramAccountCard />
        {onDone ? (
          <div className="flex justify-end">
            <Button icon={CheckCircle2} onClick={onDone}>
              Tayyor
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (state.auth === 'disconnected') void run(() => telegramAuth.sendCode(phone))
    else if (state.auth === 'code') {
      void run(async () => {
        await telegramAuth.signIn(code)
        setCode('')
      })
    } else if (state.auth === 'password') {
      void run(async () => {
        await telegramAuth.checkPassword(password)
        setPassword('')
      })
    }
  }

  const back = () =>
    void run(async () => {
      await telegramAuth.cancel()
      setCode('')
      setPassword('')
    })

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Steps current={state.auth} />

      {state.auth === 'disconnected' ? (
        <>
          <Field label="Telegram telefon raqamingiz" required error={error || undefined} hint="Telegram ilovasiga kirish kodi yuboriladi">
            {(id) => (
              <TextInput
                id={id}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                data-autofocus
                placeholder="+998 90 123 45 67"
                value={phone}
                invalid={!!error}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setError('')
                }}
              />
            )}
          </Field>
          <ul className="space-y-2 rounded-xl bg-slate-50 p-3.5 text-[13px] text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              Sessiya faqat shu kompyuterdagi serverda, shifrlangan holda saqlanadi.
            </li>
            <li className="flex gap-2">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
              Telegram → Sozlamalar → Qurilmalar bo'limida «EduQosun Panel» ko'rinadi, uni istalgan payt yopishingiz mumkin.
            </li>
            <li className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              Notanish odamlarga ko'p xabar yozmang — Telegram akkauntni spam deb cheklashi mumkin.
            </li>
          </ul>
          <div className="flex justify-end">
            <Button type="submit" icon={Send} loading={loading} disabled={!phone.trim()}>
              Kod yuborish
            </Button>
          </div>
        </>
      ) : null}

      {state.auth === 'code' ? (
        <>
          <Field
            label="Tasdiqlash kodi"
            required
            error={error || undefined}
            hint={
              state.codeVia === 'app'
                ? `Kod ${state.phone ? formatPhone(state.phone) : ''} raqamidagi Telegram ilovangizga («Telegram» rasmiy chatiga) yuborildi.`
                : `Kod ${state.phone ? formatPhone(state.phone) : ''} raqamiga SMS orqali yuborildi.`
            }
          >
            {(id) => (
              <TextInput
                id={id}
                inputMode="numeric"
                autoComplete="one-time-code"
                data-autofocus
                maxLength={8}
                placeholder="12345"
                value={code}
                invalid={!!error}
                className="text-center font-mono text-lg tracking-[0.4em]"
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
              />
            )}
          </Field>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kodni hech kimga aytmang. Telegram hech qachon uni boshqa joyga kiritishni so'ramaydi — faqat shu panelga kiriting.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={back} disabled={loading}>
              Raqamni o'zgartirish
            </Button>
            <Button type="submit" icon={CheckCircle2} loading={loading} disabled={code.length < 5}>
              Tasdiqlash
            </Button>
          </div>
        </>
      ) : null}

      {state.auth === 'password' ? (
        <>
          <Field
            label="Ikki bosqichli parol (Cloud password)"
            required
            error={error || undefined}
            hint={state.passwordHint ? `Eslatma: ${state.passwordHint}` : 'Telegram → Sozlamalar → Maxfiylik → Ikki bosqichli tasdiqlash'}
          >
            {(id) => (
              <TextInput
                id={id}
                type="password"
                autoComplete="current-password"
                data-autofocus
                value={password}
                invalid={!!error}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
              />
            )}
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={back} disabled={loading}>
              Bekor qilish
            </Button>
            <Button type="submit" icon={KeyRound} loading={loading} disabled={!password}>
              Kirish
            </Button>
          </div>
        </>
      ) : null}
    </form>
  )
}

export function TelegramConnectModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Telegram akkauntini ulash" description="Xabarlar sizning akkauntingiz nomidan yuboriladi va qabul qilinadi" icon={Send} iconColor="sky" size="md" persistent>
      <TelegramConnectFlow onDone={onClose} />
    </Modal>
  )
}

/* ———————————— Sahifa sarlavhasidagi holat ———————————— */

export function TelegramStatusChip() {
  const { server, configured, auth, account } = useTelegram(selectAll)
  const openSettings = () => navigateTo('settings', null, { tab: 'telegram' })

  if (server === 'checking') return null
  if (server === 'offline') {
    return (
      <Button variant="secondary" size="lg" icon={ServerOff} onClick={openSettings} title="eduqosun-server ishlamayapti">
        Server o'chiq
      </Button>
    )
  }
  if (!configured) {
    return (
      <Button variant="secondary" size="lg" icon={KeyRound} onClick={openSettings}>
        Telegramni sozlash
      </Button>
    )
  }
  if (auth !== 'connected') {
    return (
      <Button variant="outline" size="lg" onClick={() => openModal({ type: 'telegram-connect' })}>
        <TelegramIcon className="h-4 w-4" />
        Telegramni ulash
      </Button>
    )
  }
  return (
    <Button variant="secondary" size="lg" onClick={openSettings} title="Telegram sozlamalari">
      <span className="relative">
        <TelegramIcon className="h-4 w-4" />
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
      </span>
      <span className="max-w-[140px] truncate">{account?.firstName || 'Telegram'}</span>
    </Button>
  )
}

