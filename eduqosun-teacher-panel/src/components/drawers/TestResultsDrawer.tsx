import { useMemo } from 'react'
import { Copy, Eye, FileQuestion, Flag, Megaphone, PencilLine, Timer, Trash2, Trophy } from 'lucide-react'
import type { TestStatus } from '../../types'
import { testStatusLabel } from '../../data/catalog'
import { rateTone } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { formatClock, formatDateTime, formatDateWithWeekday } from '../../lib/date'
import { percent } from '../../lib/format'
import { downloadCsv } from '../../lib/download'
import { slugify } from '../../lib/text'
import { correctCount, questionCorrectRates, resultBuckets, resultPercent, testSummary } from '../../domain/tests'
import { compareStudents, currentRoster, fullName } from '../../domain/students'
import { useApp } from '../../store/appStore'
import { deleteTest, duplicateTest, setTestStatus } from '../../store/actions/tests'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { closeDrawer, confirmAction, openDrawer, openModal } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { EmptyState } from '../ui/EmptyState'
import { Menu } from '../ui/Menu'
import { ProgressBar } from '../ui/ProgressBar'

const testStatusMeta: Record<TestStatus, { label: string; color: 'slate' | 'blue' | 'green' }> = {
  draft: { label: testStatusLabel.draft, color: 'slate' },
  published: { label: testStatusLabel.published, color: 'blue' },
  finished: { label: testStatusLabel.finished, color: 'green' },
}

export function TestResultsDrawer({ testId }: { testId: string }) {
  const test = useApp((s) => s.tests.find((t) => t.id === testId))
  const group = useApp((s) => s.groups.find((g) => g.id === test?.groupId))
  const students = useApp((s) => s.students)

  const roster = useMemo(() => (group ? currentRoster(students, group) : []), [students, group])
  const rows = useMemo(() => {
    if (!test) return []
    const byId = new Map(students.map((s) => [s.id, s]))
    return test.results
      .map((result) => ({ result, student: byId.get(result.studentId), percent: resultPercent(test, result) }))
      .filter((row): row is typeof row & { student: NonNullable<typeof row.student> } => !!row.student)
      .sort((a, b) => b.percent - a.percent)
  }, [test, students])

  if (!test || !group) {
    return (
      <Drawer open onClose={closeDrawer} title="Test topilmadi">
        <EmptyState icon={FileQuestion} title="Test topilmadi" message="Bu test o'chirilgan bo'lishi mumkin." />
      </Drawer>
    )
  }

  const summary = testSummary(test)
  const rates = questionCorrectRates(test)
  const buckets = resultBuckets(test)
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count))
  const participants = new Set(test.results.map((r) => r.studentId))
  const notTaken = roster.filter((s) => !participants.has(s.id)).sort(compareStudents)
  const hardest = rates
    .map((rate, index) => ({ rate, index }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)
  const meta = testStatusMeta[test.status]

  const changeStatus = (status: TestStatus) => {
    setTestStatus(test.id, status)
    notify.success(status === 'finished' ? 'Test yakunlandi' : "Test e'lon qilindi", test.title)
  }

  const exportResults = () => {
    downloadCsv(`${slugify(test.title)}-natijalar`, [
      ['#', "O'quvchi", "To'g'ri javoblar", 'Foiz', 'Sarflangan vaqt', 'Yakunlangan'],
      ...rows.map((row, index) => [
        index + 1,
        fullName(row.student),
        `${correctCount(test, row.result)}/${test.questions.length}`,
        `${Math.round(row.percent)}%`,
        formatClock(row.result.durationSec),
        formatDateTime(row.result.finishedAt),
      ]),
    ])
    notify.success('Natijalar yuklab olindi', 'CSV faylni Excel yordamida ochishingiz mumkin.')
  }

  const remove = async () => {
    const ok = await confirmAction({
      title: "Testni o'chirish",
      message: `«${test.title}» testi va ${test.results.length} ta natija o'chiriladi.`,
      confirmLabel: "O'chirish",
    })
    if (!ok) return
    closeDrawer()
    runWithUndo("Test o'chirildi", () => deleteTest(test.id), test.title)
  }

  return (
    <Drawer
      open
      onClose={closeDrawer}
      title={test.title}
      size="lg"
      header={
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm">
            <FileQuestion className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900 dark:text-white">{test.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge color={group.color} size="xs">
                {group.name} · {group.course}
              </Badge>
              <Badge color={meta.color} size="xs" dot>
                {meta.label}
              </Badge>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatDateWithWeekday(test.date)} · {test.questions.length} savol · {test.durationMin} daq
              </span>
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <Menu
            label="Qo'shimcha amallar"
            placement="top-start"
            size="md"
            triggerClassName="mr-auto border border-slate-200 dark:border-slate-700"
            items={[
              {
                id: 'copy',
                label: 'Nusxa olish',
                icon: Copy,
                onSelect: () => {
                  const copy = duplicateTest(test.id)
                  if (copy) {
                    notify.success('Nusxa yaratildi', copy.title)
                    openModal({ type: 'test-builder', testId: copy.id })
                  }
                },
              },
              { id: 'edit', label: 'Tahrirlash', icon: PencilLine, onSelect: () => openModal({ type: 'test-builder', testId: test.id }) },
              { id: 'export', label: 'Natijalarni yuklab olish (CSV)', icon: Trophy, disabled: rows.length === 0, onSelect: exportResults },
              { id: 'delete', label: "O'chirish", icon: Trash2, tone: 'danger', divider: true, onSelect: () => void remove() },
            ]}
          />
          <Button variant="secondary" icon={Eye} onClick={() => openModal({ type: 'test-preview', testId: test.id })}>
            Sinab ko'rish
          </Button>
          {test.status === 'published' ? (
            <Button icon={Flag} onClick={() => changeStatus('finished')}>
              Yakunlash
            </Button>
          ) : test.status === 'draft' ? (
            <Button icon={Megaphone} onClick={() => changeStatus('published')}>
              E'lon qilish
            </Button>
          ) : (
            <Button variant="soft" icon={Megaphone} onClick={() => changeStatus('published')}>
              Qayta ochish
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: 'Ishtirokchilar', value: `${summary.participants}/${roster.length}` },
            { label: "O'rtacha natija", value: summary.averagePercent === null ? '—' : `${Math.round(summary.averagePercent)}%` },
            { label: 'Eng yuqori', value: summary.best === null ? '—' : `${Math.round(summary.best)}%` },
            { label: 'Eng past', value: summary.worst === null ? '—' : `${Math.round(summary.worst)}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {test.results.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="Hali natijalar yo'q"
            message={
              test.status === 'draft'
                ? "Test qoralama holatida. O'quvchilar ko'rishi uchun uni e'lon qiling."
                : "O'quvchilar testni topshirgach, natijalar shu yerda paydo bo'ladi."
            }
          />
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Natijalar taqsimoti</h3>
                <div className="flex h-28 items-end gap-3">
                  {buckets.map((bucket, index) => (
                    <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{bucket.count}</span>
                      <svg className="w-full" height={72} role="img" aria-label={`${bucket.label}: ${bucket.count}`}>
                        <rect
                          x="15%"
                          width="70%"
                          y={72 - (bucket.count / maxBucket) * 72}
                          height={(bucket.count / maxBucket) * 72}
                          rx={4}
                          className={cn(['fill-rose-400', 'fill-amber-400', 'fill-blue-500', 'fill-emerald-500'][index])}
                        />
                      </svg>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{bucket.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Eng qiyin savollar</h3>
                <ul className="space-y-2.5">
                  {hardest.map(({ rate, index }) => (
                    <li key={index}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-slate-600 dark:text-slate-300" title={test.questions[index].text}>
                          {index + 1}. {test.questions[index].text}
                        </span>
                        <span className="shrink-0 font-semibold text-slate-800 dark:text-slate-100">{Math.round(rate)}%</span>
                      </div>
                      <ProgressBar value={rate} color={rateTone(rate)} size="xs" />
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                O'quvchilar natijalari
              </h3>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-700/60 dark:border-slate-700">
                {rows.map((row, index) => (
                  <li key={row.student.id}>
                    <button
                      type="button"
                      onClick={() => openDrawer({ type: 'student', studentId: row.student.id })}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    >
                      <span className="w-5 text-center text-xs font-semibold text-slate-400">{index + 1}</span>
                      <Avatar name={fullName(row.student)} color={row.student.color} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{fullName(row.student)}</span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          {correctCount(test, row.result)}/{test.questions.length} to'g'ri · {formatClock(row.result.durationSec)}
                        </span>
                      </span>
                      <span className="hidden w-24 sm:block">
                        <ProgressBar value={row.percent} color={rateTone(row.percent)} size="xs" />
                      </span>
                      <span
                        className={cn(
                          'w-12 text-right text-sm font-bold tabular-nums',
                          row.percent >= 85 ? 'text-emerald-600' : row.percent >= 60 ? 'text-blue-600' : 'text-rose-600',
                        )}
                      >
                        {Math.round(row.percent)}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {notTaken.length > 0 && test.status !== 'draft' ? (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Topshirmaganlar ({notTaken.length}) · {percent(notTaken.length, roster.length)}%
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {notTaken.map((student) => (
                <span
                  key={student.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-2.5 text-xs text-slate-600 dark:bg-slate-700/60 dark:text-slate-300"
                >
                  <Avatar name={fullName(student)} color={student.color} size="xs" className="h-5 w-5 text-[8px]" />
                  {fullName(student)}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Drawer>
  )
}
