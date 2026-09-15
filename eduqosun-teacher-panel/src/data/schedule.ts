import type { ScheduleLesson } from '../types'

/** Bugungi dars jadvali (§7.5) — Bosh sahifa va Darslarim sahifasida ishlatiladi */
export const todaySchedule: ScheduleLesson[] = [
  { id: 's1', timeStart: '08:30', timeEnd: '10:00', title: 'JavaScript (Asosiy)', group: '11-A', status: 'held', badge: 'JS', color: 'blue' },
  { id: 's2', timeStart: '10:20', timeEnd: '11:50', title: 'HTML & CSS (Asosiy)', group: '11-B', status: 'held', badge: 'HTML', color: 'green' },
  { id: 's3', timeStart: '12:10', timeEnd: '13:40', title: "Python (Boshlang'ich)", group: '10-A', status: 'now', badge: 'PY', color: 'violet' },
  { id: 's4', timeStart: '15:00', timeEnd: '16:30', title: 'Web Development', group: '11-A', status: 'planned', badge: 'WD', color: 'amber' },
]
