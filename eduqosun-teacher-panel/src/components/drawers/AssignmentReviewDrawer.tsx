import { useMemo, useState } from 'react'
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  Copy,
  ExternalLink,
  Lock,
  LockOpen,
  MessageCircle,
  PencilLine,
  Trash2,
  Undo2,
} from 'lucide-react'
import type { Assignment, Student, Submission } from '../../types'
import { cn } from '../../lib/cn'
import { formatDate, formatDateTime } from '../../lib/date'
import { percent } from '../../lib/format'
import { assignmentProgress, assignmentRoster, dueLabel, isLateSubmission } from '../../domain/assignments'
import { compareStudents, fullName } from '../../domain/students'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import {
  clearSubmissionGrade,
  deleteAssignment,
  duplicateAssignment,
  gradeSubmission,
  remindStudents,
  setAssignmentStatus,
} from '../../store/actions/assignments'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { closeDrawer, confirmAction, openModal } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { EmptyState } from '../ui/EmptyState'
import { TextInput } from '../ui/Form'
import { GroupTile } from '../ui/GroupIcon'
import { Menu } from '../ui/Menu'
import { ProgressBar } from '../ui/ProgressBar'
import { SegmentedControl } from '../ui/Tabs'

type Tab = 'pending' | 'graded' | 'missing'

/** Javob matnidagi havolalarni bosiladigan qiladi */
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <p className="break-words text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {part.replace(/^https?:\/\//, '')}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  )
}

function quickScores(max: number): number[] {
  if (max <= 5) return [2, 3, 4, 5]
  if (max <= 10) return [6, 7, 8, 9, 10]
  const step = max / 5
  return [2, 3, 4, 5].map((n) => Math.round(step * n)).concat(max).filter((v, i, list) => list.indexOf(v) === i).slice(-5)
}

interface GradeFormProps {
  assignment: Assignment
  submission?: Submission
  student: Student
  onSaved?: () => void
}

function GradeForm({ assignment, submission, student, onSaved }: GradeFormProps) {
  const [score, setScore] = useState(submission?.score !== undefined ? String(submission.score) : '')
  const [feedback, setFeedback] = useState(submission?.feedback ?? '')
  const numeric = Number(score.replace(',', '.'))
  const valid = score.trim() !== '' && Number.isFinite(numeric) && numeric >= 0 && numeric <= assignment.maxScore

  const save = () => {
    if (!valid) {
      notify.error("Ball noto'g'ri", `0 dan ${assignment.maxScore} gacha son kiriting.`)
      return
    }
    gradeSubmission(assignment.id, student.id, Math.round(numeric * 10) / 10, feedback)
    notify.success('Baholandi', `${fullName(student)} — ${numeric}/${assignment.maxScore}`)
    onSaved?.()
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center gap-1.5">
        {quickScores(assignment.maxScore).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScore(String(value))}
            className={cn(
              'h-8 min-w-9 rounded-lg border px-2 text-xs font-semibold transition-colors',
              score === String(value)
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
            )}
          >
            {value}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <TextInput
            value={score}
            onChange={(event) => setScore(event.target.value)}
            inputMode="decimal"
            className="h-8 w-16 text-center"
            aria-label="Ball"
            onKeyDown={(event) => event.key === 'Enter' && save()}
          />
          <span className="text-xs text-slate-400">/ {assignment.maxScore}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <TextInput
          value={feedback}
          maxLength={300}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Izoh (ixtiyoriy): nimasi yaxshi, nimani tuzatish kerak"
          className="h-9 text-[13px]"
          onKeyDown={(event) => event.key === 'Enter' && save()}
        />
        <Button size="sm" className="h-9" onClick={save} disabled={!valid}>
          {submission?.score !== undefined ? 'Yangilash' : 'Baholash'}
        </Button>
      </div>
    </div>
  )
}

export function AssignmentReviewDrawer({ assignmentId }: { assignmentId: string }) {
  const assignment = useApp((s) => s.assignments.find((a) => a.id === assignmentId))
  const group = useApp((s) => s.groups.find((g) => g.id === assignment?.groupId))
  const students = useApp((s) => s.students)
  const submissions = useApp((s) => s.submissions[assignmentId])
  const groups = useApp((s) => s.groups)
  const { today } = useClock()
  const [tab, setTab] = useState<Tab>('pending')
  const [editing, setEditing] = useState<string | null>(null)

  const roster = useMemo(
    () => (assignment ? assignmentRoster(assignment, students).sort(compareStudents) : []),
    [assignment, students],
  )

  if (!assignment || !group) {
    return (
      <Drawer open onClose={closeDrawer} title="Topshiriq topilmadi">
        <EmptyState icon={ClipboardList} title="Topshiriq topilmadi" message="Bu topshiriq o'chirilgan bo'lishi mumkin." />
      </Drawer>
    )
  }

  const progress = assignmentProgress(assignment, roster, submissions)
  const due = dueLabel(assignment.dueDate, today)
  const pending = roster.filter((s) => submissions?.[s.id] && submissions[s.id].score === undefined)
  const graded = roster.filter((s) => submissions?.[s.id]?.score !== undefined)
  const missing = roster.filter((s) => !submissions?.[s.id])
  const list = tab === 'pending' ? pending : tab === 'graded' ? graded : missing
  const closed = assignment.status === 'closed'

  const remindAll = () => {
    const sent = remindStudents(assignment.id, missing.map((s) => s.id))
    notify.success('Eslatma yuborildi', `${sent} ta o'quvchiga shaxsiy xabar jo'natildi.`)
  }

  const toggleStatus = () => {
    setAssignmentStatus(assignment.id, closed ? 'active' : 'closed')
    notify.success(closed ? 'Topshiriq qayta ochildi' : 'Topshiriq yakunlandi', assignment.title)
  }

  const remove = async () => {
    const ok = await confirmAction({
      title: "Topshiriqni o'chirish",
      message: `«${assignment.title}» va unga yuborilgan barcha javoblar o'chiriladi.`,
      confirmLabel: "O'chirish",
    })
    if (!ok) return
    closeDrawer()
    runWithUndo("Topshiriq o'chirildi", () => deleteAssignment(assignment.id), assignment.title)
  }

  const duplicateTo = (groupId: string) => {
    const copy = duplicateAssignment(assignment.id, groupId)
    const target = groups.find((g) => g.id === groupId)
    if (copy) notify.success('Nusxa yaratildi', `${target?.name ?? ''} guruhi uchun «${copy.title}»`)
  }

  return (
    <Drawer
      open
      onClose={closeDrawer}
      title={assignment.title}
      size="lg"
      header={
        <div className="flex items-start gap-3">
          <GroupTile icon={group.icon} color={group.color} size="md" />
          <div className="min-w-0">
            <p className="text-base font-semibold leading-snug text-slate-900 dark:text-white">{assignment.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge color={group.color} size="xs">
                {group.name} · {group.course}
              </Badge>
              <Badge color={closed ? 'slate' : due.tone === 'danger' ? 'rose' : due.tone === 'warning' ? 'amber' : 'blue'} size="xs" icon={CalendarClock}>
                {closed ? 'Yakunlangan' : due.text}
              </Badge>
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
              ...groups
                .filter((g) => g.status === 'active')
                .slice(0, 8)
                .map((g) => ({
                  id: `dup-${g.id}`,
                  label: `Nusxa: ${g.name} guruhiga`,
                  icon: Copy,
                  onSelect: () => duplicateTo(g.id),
                })),
              { id: 'delete', label: "O'chirish", icon: Trash2, tone: 'danger' as const, divider: true, onSelect: () => void remove() },
            ]}
          />
          <Button variant="secondary" icon={PencilLine} onClick={() => openModal({ type: 'assignment-form', assignmentId: assignment.id })}>
            Tahrirlash
          </Button>
          <Button variant={closed ? 'soft' : 'primary'} icon={closed ? LockOpen : Lock} onClick={toggleStatus}>
            {closed ? 'Qayta ochish' : 'Yakunlash'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {assignment.description ? (
          <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
            {assignment.description}
          </p>
        ) : null}

        <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Topshirdi: {progress.submitted}/{progress.total}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Muddat: {formatDate(assignment.dueDate)}, {assignment.dueTime} · Maks. {assignment.maxScore} ball
            </span>
          </div>
          <ProgressBar value={percent(progress.submitted, progress.total)} color="green" className="mt-2" />
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Tekshirilmagan', value: progress.pending, tone: 'text-amber-600 dark:text-amber-400' },
              { label: 'Baholangan', value: progress.graded, tone: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Kechikkan', value: progress.late, tone: 'text-rose-600 dark:text-rose-400' },
              {
                label: "O'rtacha ball",
                value: progress.averageScore === null ? '—' : Math.round(progress.averageScore * 10) / 10,
                tone: 'text-blue-600 dark:text-blue-400',
              },
            ].map((item) => (
              <div key={item.label}>
                <p className={cn('text-lg font-bold', item.tone)}>{item.value}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <SegmentedControl<Tab>
          label="Javoblar"
          fullWidth
          size="sm"
          items={[
            { value: 'pending', label: 'Tekshirish', count: pending.length },
            { value: 'graded', label: 'Baholangan', count: graded.length },
            { value: 'missing', label: 'Topshirmagan', count: missing.length },
          ]}
          value={tab}
          onChange={(next) => {
            setTab(next)
            setEditing(null)
          }}
        />

        {tab === 'missing' && missing.length > 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            <span>{missing.length} ta o'quvchi hali topshirmagan.</span>
            <Button size="xs" variant="secondary" icon={BellRing} onClick={remindAll}>
              Hammaga eslatma
            </Button>
          </div>
        ) : null}

        {list.length === 0 ? (
          <EmptyState
            compact
            icon={CheckCheck}
            title={tab === 'pending' ? 'Hammasi tekshirilgan' : tab === 'graded' ? "Hali baholanmagan" : 'Hamma topshirgan'}
            message={
              tab === 'pending'
                ? "Yangi javoblar kelganda shu yerda ko'rinadi."
                : tab === 'graded'
                  ? "«Tekshirish» bo'limidagi javoblarni baholang."
                  : "Barcha o'quvchilar javob yuborgan. Ajoyib!"
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {list.map((student) => {
              const submission = submissions?.[student.id]
              const late = submission ? isLateSubmission(assignment, submission) : false
              const isEditing = tab === 'pending' || editing === student.id
              return (
                <li key={student.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Avatar name={fullName(student)} color={student.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{fullName(student)}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {submission ? `Yuborildi: ${formatDateTime(submission.submittedAt)}` : 'Javob yubormagan'}
                      </p>
                    </div>
                    {late ? (
                      <Badge color="rose" size="xs">
                        Kechikkan
                      </Badge>
                    ) : null}
                    {tab === 'graded' && submission?.score !== undefined ? (
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-sm font-bold tabular-nums text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {submission.score}/{assignment.maxScore}
                      </span>
                    ) : null}
                    {tab === 'missing' ? (
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={MessageCircle}
                        onClick={() => {
                          remindStudents(assignment.id, [student.id])
                          notify.success('Eslatma yuborildi', fullName(student))
                        }}
                      >
                        Eslatish
                      </Button>
                    ) : null}
                  </div>

                  {submission ? (
                    <div className="mt-2 pl-12">
                      <AnswerText text={submission.answer} />
                      {tab === 'graded' && submission.feedback && editing !== student.id ? (
                        <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs italic text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                          «{submission.feedback}»
                        </p>
                      ) : null}
                      {tab === 'graded' && editing !== student.id ? (
                        <div className="mt-2 flex gap-1.5">
                          <Button size="xs" variant="ghost" icon={PencilLine} onClick={() => setEditing(student.id)}>
                            O'zgartirish
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={Undo2}
                            onClick={() => {
                              clearSubmissionGrade(assignment.id, student.id)
                              notify.info('Baho bekor qilindi', fullName(student))
                            }}
                          >
                            Bahoni bekor qilish
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {submission && isEditing ? (
                    <div className="pl-12">
                      <GradeForm
                        key={`${student.id}-${submission.score ?? 'new'}`}
                        assignment={assignment}
                        submission={submission}
                        student={student}
                        onSaved={() => setEditing(null)}
                      />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Drawer>
  )
}
