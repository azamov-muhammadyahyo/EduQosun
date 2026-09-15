import { BookOpen, CheckCircle2, Mail, Star, UserPlus } from 'lucide-react'
import type { ActivityItem } from '../types'

/** So'nggi faoliyat oqimi (§7.13) */
export const activityFeed: ActivityItem[] = [
  { id: 'a1', actor: 'Bekzod Rahimov', text: 'topshiriqni topshirdi', datetime: '12.05.2025 10:24', icon: CheckCircle2, color: 'green' },
  { id: 'a2', text: "Guruh 11-A ga yangi dars qo'shildi", datetime: '12.05.2025 09:15', icon: BookOpen, color: 'blue' },
  { id: 'a3', actor: 'Dilshodbek Xolikov', text: 'xabar yubordi', datetime: '12.05.2025 08:50', icon: Mail, color: 'violet' },
  { id: 'a4', actor: 'Malika Karimova', text: 'bahosi yangilandi (9 → 10)', datetime: '11.05.2025 16:32', icon: Star, color: 'amber' },
  { id: 'a5', text: "Yangi o'quvchi qo'shildi (11-B)", datetime: '11.05.2025 14:10', icon: UserPlus, color: 'green' },
]
