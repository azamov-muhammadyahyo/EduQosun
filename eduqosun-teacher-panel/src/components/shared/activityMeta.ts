import {
  BookOpen,
  CalendarCheck,
  CircleCheck,
  ClipboardList,
  FileQuestion,
  Mail,
  Star,
  UserPlus,
  Users,
  BellRing,
  type LucideIcon,
} from 'lucide-react'
import type { AccentColor, ActivityKind } from '../../types'

/** Faoliyat turi → ikonka va rang */
export const activityMeta: Record<ActivityKind, { icon: LucideIcon; color: AccentColor }> = {
  submission: { icon: CircleCheck, color: 'green' },
  lesson: { icon: BookOpen, color: 'blue' },
  message: { icon: Mail, color: 'violet' },
  grade: { icon: Star, color: 'amber' },
  student: { icon: UserPlus, color: 'green' },
  group: { icon: Users, color: 'sky' },
  assignment: { icon: ClipboardList, color: 'orange' },
  test: { icon: FileQuestion, color: 'indigo' },
  attendance: { icon: CalendarCheck, color: 'teal' },
  reminder: { icon: BellRing, color: 'pink' },
}
