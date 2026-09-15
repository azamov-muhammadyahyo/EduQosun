import type { ActivityChartPoint, MiniStat } from '../types'

/** O'quvchilar faoliyati grafigi — so'nggi 7 kun (§7.9) */
export const studentActivityData: ActivityChartPoint[] = [
  { day: '6 may', attendance: 85, tasks: 58 },
  { day: '7 may', attendance: 90, tasks: 72 },
  { day: '8 may', attendance: 78, tasks: 54 },
  { day: '9 may', attendance: 93, tasks: 80 },
  { day: '10 may', attendance: 88, tasks: 66 },
  { day: '11 may', attendance: 95, tasks: 84 },
  { day: '12 may', attendance: 92, tasks: 78 },
]

/** Grafik ostidagi 3 mini statistika (§7.9) */
export const activityMiniStats: MiniStat[] = [
  { id: 'avg-attendance', label: "O'rtacha qatnashuv", value: '92%', change: '↑ 5%' },
  { id: 'submitted', label: 'Topshiriq topshirganlar', value: '78%', change: '↑ 12%' },
  { id: 'active-students', label: "Faol o'quvchilar", value: '104', change: '↑ 8%' },
]
