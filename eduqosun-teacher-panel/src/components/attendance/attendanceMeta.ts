import { CircleCheck, CircleX, Clock, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { AttendanceStatus } from '../../types'
import { attendanceLabel, attendanceShort } from '../../data/catalog'

export interface AttendanceStatusMeta {
  label: string
  short: string
  icon: LucideIcon
  /** Tanlangan tugma */
  active: string
  /** Jurnal katagi */
  cell: string
  /** Legenda nuqtasi */
  dot: string
  /** SVG halqa */
  stroke: string
}

export const attendanceStatuses: AttendanceStatus[] = ['present', 'late', 'absent', 'excused']

export const attendanceMeta: Record<AttendanceStatus, AttendanceStatusMeta> = {
  present: {
    label: attendanceLabel.present,
    short: attendanceShort.present,
    icon: CircleCheck,
    active: 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30',
    cell: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    stroke: 'stroke-emerald-500',
  },
  late: {
    label: attendanceLabel.late,
    short: attendanceShort.late,
    icon: Clock,
    active: 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/30',
    cell: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500',
    stroke: 'stroke-amber-500',
  },
  absent: {
    label: attendanceLabel.absent,
    short: attendanceShort.absent,
    icon: CircleX,
    active: 'border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-500/30',
    cell: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    dot: 'bg-rose-500',
    stroke: 'stroke-rose-500',
  },
  excused: {
    label: attendanceLabel.excused,
    short: attendanceShort.excused,
    icon: ShieldCheck,
    active: 'border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/30',
    cell: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    dot: 'bg-sky-500',
    stroke: 'stroke-sky-500',
  },
}

/** Jurnal katagini bosganda navbatdagi holat (oxiridan keyin — belgisiz) */
export function nextStatus(current: AttendanceStatus | undefined): AttendanceStatus | null {
  if (!current) return 'present'
  const index = attendanceStatuses.indexOf(current)
  return index === attendanceStatuses.length - 1 ? null : attendanceStatuses[index + 1]
}
