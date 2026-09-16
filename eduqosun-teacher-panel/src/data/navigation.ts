import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  House,
  Mail,
  Settings,
  Users,
} from 'lucide-react'
import type { NavItem, PageId } from '../types'

/** Asosiy navigatsiya menyusi */
export const primaryNav: NavItem[] = [
  { id: 'home', label: 'Bosh sahifa', icon: House },
  { id: 'lessons', label: 'Darslarim', icon: CalendarDays },
  { id: 'groups', label: 'Guruhlarim', icon: Users },
  { id: 'students', label: "O'quvchilar", icon: GraduationCap },
  { id: 'grades', label: 'Baholashlar', icon: ClipboardCheck },
  { id: 'attendance', label: 'Davomat', icon: CalendarCheck },
  { id: 'tasks', label: 'Topshiriqlar', icon: ClipboardList },
  { id: 'tests', label: 'Testlar', icon: FileQuestion },
  { id: 'messages', label: 'Xabarlar', icon: Mail },
  { id: 'reminders', label: 'Eslatmalar', icon: Bell },
  { id: 'statistics', label: 'Statistika', icon: ChartColumn },
]

/** Ajratuvchi chiziqdan keyingi menyu */
export const secondaryNav: NavItem[] = [{ id: 'settings', label: 'Sozlamalar', icon: Settings }]

/** Barcha menyu elementlari */
export const allNav: NavItem[] = [...primaryNav, ...secondaryNav]

export const pageIds: PageId[] = allNav.map((item) => item.id)

export function navItemOf(page: PageId): NavItem {
  return allNav.find((item) => item.id === page) ?? primaryNav[0]
}
