import type { UpcomingTask } from '../types'

/** Keyingi vazifalar (§7.12) */
export const upcomingTasks: UpcomingTask[] = [
  { id: 't1', group: '11-B', subject: 'JavaScript', description: '"Array metodlari" mavzusidan topshiriq', due: '13.05.2025', color: 'blue' },
  { id: 't2', group: '10-A', subject: 'Python', description: '"Dastur tuzish" (amaliy ish)', due: '14.05.2025', color: 'green' },
  { id: 't3', group: '11-A', subject: 'ReactJS', description: 'Komponentlar bilan ishlash', due: '15.05.2025', color: 'violet' },
  { id: 't4', group: '10-B', subject: 'Web', description: 'UI dizayn (tailwind)', due: '16.05.2025', color: 'amber' },
]
