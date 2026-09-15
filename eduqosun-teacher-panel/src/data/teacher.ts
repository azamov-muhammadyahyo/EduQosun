import type { CalendarInfo, TeacherProfile } from '../types'

/** O'qituvchi profili + salomlashuv bloki (§7.3) */
export const teacher: TeacherProfile = {
  fullName: 'Azamatov Sardor',
  role: "O'qituvchi",
  initials: 'AS',
  greeting: 'Assalomu alaykum, Azamatov Sardor! 👋',
  subtitle: 'Bugungi kun uchun rejalashtirilgan darslar, guruhlar va vazifalar.',
  dateLabel: 'Dushanba, 12-may 2025',
}

/** Kun taqvimi ma'lumoti (§7.7) */
export const calendarInfo: CalendarInfo = {
  year: 2025,
  month: 4, // May (0-indeksli)
  monthLabel: 'May 2025',
  activeDay: 12,
  weekdays: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
  summaryTitle: 'Bugun 4 ta dars bor',
  summarySubtitle: "2 dars o'tkazildi, 2 dars qolmoqda",
}
