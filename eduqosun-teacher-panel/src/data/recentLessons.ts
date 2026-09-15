import type { RecentLesson } from '../types'

/** Oxirgi darslar (§7.11) — fan belgisi ranglari "Darslarim" sahifasi bilan bir xil */
export const recentLessons: RecentLesson[] = [
  { id: 'r1', date: '12.05.2025', timeStart: '10:20', timeEnd: '11:50', group: '11-B', topic: 'HTML & CSS', status: 'held', badge: 'HTML', color: 'orange' },
  { id: 'r2', date: '12.05.2025', timeStart: '08:30', timeEnd: '10:00', group: '11-A', topic: 'JavaScript', status: 'held', badge: 'JS', color: 'amber' },
  { id: 'r3', date: '11.05.2025', timeStart: '12:10', timeEnd: '13:40', group: '10-A', topic: 'Python', status: 'held', badge: 'PY', color: 'blue' },
  { id: 'r4', date: '10.05.2025', timeStart: '15:00', timeEnd: '16:30', group: '11-B', topic: 'ReactJS', status: 'held', badge: 'RE', color: 'sky' },
  { id: 'r5', date: '09.05.2025', timeStart: '10:20', timeEnd: '11:50', group: '10-B', topic: 'Web Development', status: 'held', badge: 'WD', color: 'sky' },
]
