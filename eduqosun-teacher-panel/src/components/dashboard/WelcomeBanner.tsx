import { CalendarDays } from 'lucide-react'
import { formatWeekdayDate } from '../../lib/date'
import { useProfile, useTeacherName } from '../../hooks/useData'
import { useClock } from '../../store/clock'
import { navigateTo } from '../../router'
import { Avatar } from '../ui/Avatar'

interface WelcomeBannerProps {
  lessonsToday: number
  pendingReviews: number
}

/** Kun vaqtiga mos salomlashuv */
function greetingFor(hour: number): string {
  if (hour < 5) return 'Xayrli tun'
  if (hour < 11) return 'Xayrli tong'
  if (hour < 18) return 'Assalomu alaykum'
  return 'Xayrli kech'
}

/** Salomlashuv bloki — stat kartalar bilan bir qatorda turadi */
export function WelcomeBanner({ lessonsToday, pendingReviews }: WelcomeBannerProps) {
  const profile = useProfile()
  const name = useTeacherName()
  const { now, today } = useClock()

  const summary =
    lessonsToday === 0
      ? "Bugun rejalashtirilgan dars yo'q — dam oling yoki yangi mavzularga tayyorlaning."
      : `Bugun ${lessonsToday} ta dars${pendingReviews > 0 ? `, ${pendingReviews} ta tekshirilmagan topshiriq` : ''} sizni kutmoqda.`

  return (
    <section className="flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-sky-50 to-white p-5 dark:border-slate-700/60 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
      <button
        type="button"
        onClick={() => navigateTo('settings', null, { tab: 'profile' })}
        className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Profilni ochish"
      >
        <Avatar name={`${profile.firstName} ${profile.lastName}`} color={profile.color} size="xl" variant="solid" className="shadow-lg shadow-blue-600/20" />
      </button>
      <div className="min-w-0">
        <h1 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
          {greetingFor(now.getHours())}, {name}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{summary}</p>
        <p className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-700">
          <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          {formatWeekdayDate(today)}
        </p>
      </div>
    </section>
  )
}
