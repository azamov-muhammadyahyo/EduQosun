import { CalendarPlus, ClipboardList, FileQuestion, Send, Users } from 'lucide-react'
import type { QuickAction } from '../types'

/** Tezkor amallar (§7.6) */
export const quickActions: QuickAction[] = [
  {
    id: 'new-group',
    title: 'Yangi guruh yaratish',
    description: "Guruh ochish va o'quvchilar qo'shish",
    icon: Users,
    color: 'blue',
  },
  {
    id: 'schedule',
    title: 'Dars jadvalini tuzish',
    description: 'Dars vaqti va mavzusini belgilash',
    icon: CalendarPlus,
    color: 'green',
  },
  {
    id: 'give-task',
    title: 'Topshiriq berish',
    description: "O'quvchilarga vazifa yuklash",
    icon: ClipboardList,
    color: 'amber',
  },
  {
    id: 'create-test',
    title: 'Test yaratish',
    description: 'Onlayn test tayyorlash',
    icon: FileQuestion,
    color: 'violet',
  },
  {
    id: 'send-message',
    title: 'Xabar yuborish',
    description: "Guruh yoki o'quvchilarga xabar",
    icon: Send,
    color: 'rose',
  },
]
