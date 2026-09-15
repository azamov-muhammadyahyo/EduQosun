import type { Group, GroupFilter } from '../types'

/** Guruh filtr "chip"lari (§7.8) — sonlar ro'yxatdagi guruhlarga mos */
export const groupFilters: GroupFilter[] = [
  { id: 'all', label: 'Barchasi', count: 6 },
  { id: 'grade-11', label: '11-sinf', count: 2 },
  { id: 'grade-10', label: '10-sinf', count: 2 },
  { id: 'other', label: 'Boshqa', count: 2 },
]

/** Guruhlarim ro'yxati (§7.8) */
export const groups: Group[] = [
  { id: 'g1', name: '11-A', subject: 'Dasturlash', studentCount: 22, activity: 'Bugun: 2 dars, 1 topshiriq', grade: 'grade-11', color: 'blue' },
  { id: 'g2', name: '11-B', subject: 'Dasturlash', studentCount: 20, activity: 'Bugun: 2 dars, 2 topshiriq', grade: 'grade-11', color: 'violet' },
  { id: 'g3', name: '10-A', subject: 'Python', studentCount: 18, activity: 'Bugun: 1 dars, 1 topshiriq', grade: 'grade-10', color: 'green' },
  { id: 'g4', name: '10-B', subject: 'Web', studentCount: 16, activity: 'Bugun: 1 dars, 0 topshiriq', grade: 'grade-10', color: 'amber' },
  { id: 'g5', name: '9-A', subject: 'IT Asoslari', studentCount: 15, activity: 'Bugun: 0 dars, 0 topshiriq', grade: 'other', color: 'sky' },
  { id: 'g6', name: '9-B', subject: 'Dasturlash', studentCount: 13, activity: 'Bugun: 0 dars, 1 topshiriq', grade: 'other', color: 'rose' },
]
