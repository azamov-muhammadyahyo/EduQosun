import { CalendarClock, CalendarDays, ClipboardList, Clock, GraduationCap, Users, UsersRound } from 'lucide-react'
import type { Stat } from '../types'

/** Bosh sahifadagi 4 ta statistika kartochkasi (§7.4) */
export const stats: Stat[] = [
  {
    id: 'groups',
    label: 'Jami guruhlar',
    value: '6',
    change: '+1 yangi',
    changeTone: 'up',
    icon: Users,
    color: 'blue',
  },
  {
    id: 'students',
    label: "Jami o'quvchilar",
    value: '124',
    change: '+6 bugun',
    changeTone: 'up',
    icon: GraduationCap,
    color: 'green',
  },
  {
    id: 'today-lessons',
    label: 'Bugungi darslar',
    value: '4',
    change: "2 ta o'tkazildi",
    changeTone: 'muted',
    icon: CalendarClock,
    color: 'violet',
  },
  {
    id: 'tasks',
    label: 'Topshiriqlar',
    value: '8',
    change: '5 ta tekshirishda',
    changeTone: 'muted',
    icon: ClipboardList,
    color: 'amber',
  },
]

/** Darslarim sahifasidagi 4 ta statistika kartochkasi (o'sish belgisi ↑ ikonka bilan chiziladi) */
export const lessonsStats: Stat[] = [
  {
    id: 'l-total',
    label: 'Jami darslar',
    value: '12',
    change: '2 ta yangi',
    changeTone: 'up',
    icon: CalendarDays,
    color: 'blue',
  },
  {
    id: 'l-students',
    label: "Jami o'quvchilar",
    value: '86',
    change: '5 ta yangi',
    changeTone: 'up',
    icon: Users,
    color: 'green',
  },
  {
    id: 'l-groups',
    label: 'Guruhlar',
    value: '6',
    change: '1 ta yangi',
    changeTone: 'up',
    icon: UsersRound,
    color: 'violet',
  },
  {
    id: 'l-today',
    label: 'Bugungi darslar',
    value: '4',
    change: "2 ta o'tkazildi",
    changeTone: 'muted',
    icon: Clock,
    color: 'amber',
  },
]
