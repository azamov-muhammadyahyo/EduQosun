import { useMemo } from 'react'
import { Brain, Medal } from 'lucide-react'
import type { Group, Student, Test } from '../../types'
import { formatTimeAgo } from '../../lib/date'
import { questionCorrectRates, resultPercent } from '../../domain/tests'
import { fullName } from '../../domain/students'
import { useNow } from '../../store/clock'
import { openDrawer } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { PanelHeader } from '../ui/PanelHeader'
import { ProgressBar } from '../ui/ProgressBar'

interface TestsInsightsProps {
  tests: Test[]
  studentMap: Map<string, Student>
  groupMap: Map<string, Group>
}

/** O'ng ustun: so'nggi natijalar va eng qiyin savollar */
export function TestsInsights({ tests, studentMap, groupMap }: TestsInsightsProps) {
  const now = useNow()

  const recent = useMemo(
    () =>
      tests
        .flatMap((test) => test.results.map((result) => ({ test, result, student: studentMap.get(result.studentId) })))
        .filter((item) => item.student)
        .sort((a, b) => b.result.finishedAt.localeCompare(a.result.finishedAt))
        .slice(0, 6),
    [tests, studentMap],
  )

  const hardest = useMemo(
    () =>
      tests
        .filter((test) => test.results.length >= 3)
        .flatMap((test) => {
          const rates = questionCorrectRates(test)
          return test.questions.map((question, index) => ({ test, question, rate: rates[index] }))
        })
        .sort((a, b) => a.rate - b.rate)
        .slice(0, 5),
    [tests],
  )

  return (
    <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
      <Card className="p-5">
        <PanelHeader title="So'nggi natijalar" icon={Medal} subtitle="Test topshirgan o'quvchilar" />
        {recent.length === 0 ? (
          <EmptyState compact icon={Medal} message="Hali natija yo'q" />
        ) : (
          <ul className="mt-3 space-y-1">
            {recent.map(({ test, result, student }) =>
              student ? (
                <li key={`${test.id}-${student.id}`}>
                  <button
                    type="button"
                    onClick={() => openDrawer({ type: 'test-results', testId: test.id })}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  >
                    <Avatar name={fullName(student)} color={student.color} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{fullName(student)}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {test.title} · {formatTimeAgo(result.finishedAt, now)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
                      {Math.round(resultPercent(test, result))}%
                    </span>
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <PanelHeader title="Eng qiyin savollar" icon={Brain} subtitle="Kam to'g'ri javob berilgan — qayta tushuntiring" />
        {hardest.length === 0 ? (
          <EmptyState compact icon={Brain} message="Tahlil uchun natijalar yetarli emas" />
        ) : (
          <ul className="mt-3 space-y-3">
            {hardest.map(({ test, question, rate }) => (
              <li key={`${test.id}-${question.id}`}>
                <button type="button" onClick={() => openDrawer({ type: 'test-results', testId: test.id })} className="w-full text-left">
                  <span className="line-clamp-2 text-sm font-medium text-slate-800 hover:text-blue-600 dark:text-slate-100">{question.text}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                    {groupMap.get(test.groupId)?.name} · {test.title}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <ProgressBar value={rate} color={rate < 40 ? 'rose' : rate < 60 ? 'amber' : 'blue'} size="xs" className="flex-1" />
                    <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">{Math.round(rate)}%</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
