import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  Home,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react'
import type { NavItem } from '../types'

/** Asosiy navigatsiya menyusi (§7.1) */
export const primaryNav: NavItem[] = [
  { id: 'home', label: 'Bosh sahifa', icon: Home },
  { id: 'lessons', label: 'Darslarim', icon: BookOpen },
  { id: 'groups', label: 'Guruhlarim', icon: Users },
  { id: 'students', label: "O'quvchilar", icon: GraduationCap },
  { id: 'grades', label: 'Baholashlar', icon: ClipboardCheck },
  { id: 'attendance', label: 'Davomat', icon: CalendarCheck },
  { id: 'tasks', label: 'Topshiriqlar', icon: ClipboardList },
  { id: 'tests', label: 'Testlar', icon: FileQuestion },
  { id: 'messages', label: 'Xabarlar', icon: MessageSquare },
  { id: 'reminders', label: 'Eslatmalar', icon: Bell },
  { id: 'statistics', label: 'Statistika', icon: BarChart3 },
]

/** Ajratuvchi chiziqdan keyingi menyu */
export const secondaryNav: NavItem[] = [
  { id: 'settings', label: 'Sozlamalar', icon: Settings },
]

/** Barcha menyu elementlari (sarlavha/placeholder uchun qidirishda qulay) */
export const allNav: NavItem[] = [...primaryNav, ...secondaryNav]
