import { BellRing, CircleCheckBig, PieChart, Shuffle } from 'lucide-react'
import type { AttendanceSummary as Summary } from '../../domain/attendance'
import { attendanceRate, homeworkRate } from '../../domain/attendance'
import { percent } from '../../lib/format'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Donut } from '../ui/Donut'
import { PanelHeader } from '../ui/PanelHeader'
import { attendanceMeta, attendanceStatuses } from './attendanceMeta'

interface AttendanceSummaryProps {
  summary: Summary
  rosterSize: number
  disabled: boolean
  onFinish: () => void
  onNotifyAbsent: () => void
  onRandom: () => void
}

/** Yo'qlama xulosasi: holatlar ulushi va yakuniy amallar */
export function AttendanceSummary({ summary, rosterSize, disabled, onFinish, onNotifyAbsent, onRandom }: AttendanceSummaryProps) {
  const rate = attendanceRate(summary)
  const homework = homeworkRate(summary)
  const unmarked = Math.max(0, rosterSize - summary.total)

  return (
    <Card className="p-5">
      <PanelHeader title="Darsdagi davomat" icon={PieChart} subtitle={`${summary.total}/${rosterSize} ta belgilandi`} />
      <div className="mt-5 flex items-center gap-5">
        <Donut
          size={120}
          thickness={14}
          label="Davomat tarkibi"
          segments={[
            ...attendanceStatuses.map((status) => ({ id: status, value: summary[status], strokeClass: attendanceMeta[status].stroke })),
            { id: 'unmarked', value: unmarked, strokeClass: 'stroke-slate-200 dark:stroke-slate-600' },
          ]}
        >
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{rate === null ? '—' : `${Math.round(rate)}%`}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">davomat</span>
        </Donut>
        <ul className="min-w-0 flex-1 space-y-2">
          {attendanceStatuses.map((status) => (
            <li key={status} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className={`h-2.5 w-2.5 rounded-full ${attendanceMeta[status].dot}`} aria-hidden="true" />
                {attendanceMeta[status].label}
              </span>
              <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{summary[status]}</span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-2 text-[13px]">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-600" aria-hidden="true" />
              Belgilanmagan
            </span>
            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{unmarked}</span>
          </li>
        </ul>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
        Uy vazifasini bajarganlar:{' '}
        <span className="font-semibold text-slate-900 dark:text-white">
          {homework === null ? "belgilanmagan" : `${summary.homeworkDone}/${summary.homeworkChecked} (${percent(summary.homeworkDone, summary.homeworkChecked)}%)`}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <Button fullWidth icon={CircleCheckBig} onClick={onFinish} disabled={disabled || rosterSize === 0}>
          Yo'qlamani yakunlash
        </Button>
        <Button fullWidth variant="secondary" icon={BellRing} onClick={onNotifyAbsent} disabled={disabled || summary.absent === 0}>
          Kelmaganlar ota-onasiga xabar ({summary.absent})
        </Button>
        <Button fullWidth variant="ghost" icon={Shuffle} onClick={onRandom} disabled={rosterSize === 0}>
          Tasodifiy o'quvchi tanlash
        </Button>
      </div>
    </Card>
  )
}
