import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRightLeft,
  Cake,
  CalendarCheck,
  CircleAlert,
  ClipboardList,
  GraduationCap,
  Mail,
  MessageCircle,
  NotebookPen,
  PencilLine,
  Phone,
  Star,
  Trash2,
  UserMinus,
  UserRound,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import type { AccentColor, AttendanceStatus, DateKey } from '../../types'
import { attendanceLabel } from '../../data/catalog'
import { rateTone } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { diffDays, formatDate, formatDayMonth, formatNumericDate, todayKey } from '../../lib/date'
import { formatScore, phoneHref } from '../../lib/format'
import { lessonKeyInfo } from '../../domain/attendance'
import { formatGrade, gradeColumns, gradeFor } from '../../domain/grades'
import { fullName } from '../../domain/students'
import { useStudentMetrics } from '../../hooks/useData'
import { useApp } from '../../store/appStore'
import { deleteStudent, removeFromGroup, restoreStudent, setStudentNote } from '../../store/actions/students'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { closeDrawer, confirmAction, openModal } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { EmptyState } from '../ui/EmptyState'
import { TextArea } from '../ui/Form'
import { Menu } from '../ui/Menu'
import { ProgressBar } from '../ui/ProgressBar'
import { ScoreBadge, StudentStatusBadge } from '../ui/StatusBadges'

const statusCell: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  late: 'bg-amber-400',
  excused: 'bg-sky-400',
  absent: 'bg-rose-500',
}

function Kpi({ label, value, hint, progress, tone }: { label: string; value: string; hint?: string; progress?: number | null; tone: AccentColor }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      {progress !== undefined && progress !== null ? <ProgressBar value={progress} color={tone} size="xs" className="mt-1.5" /> : null}
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  )
}

function ContactRow({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
        {href ? (
          <a href={href} className="block truncate text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            {value}
          </a>
        ) : (
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{value || '—'}</p>
        )}
      </div>
    </div>
  )
}

/** O'qituvchi izohi — yozilishi bilan avtomatik saqlanadi */
function TeacherNote({ studentId, initial }: { studentId: string; initial: string }) {
  const [value, setValue] = useState(initial)
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timer = useRef<number>()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const change = (next: string) => {
    setValue(next)
    setState('saving')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setStudentNote(studentId, next.trim())
      setState('saved')
    }, 600)
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
          O'qituvchi izohi
        </h3>
        <span className="text-[11px] text-slate-400">{state === 'saving' ? 'Saqlanmoqda...' : state === 'saved' ? 'Saqlandi' : "Faqat sizga ko'rinadi"}</span>
      </div>
      <TextArea
        rows={3}
        value={value}
        maxLength={600}
        onChange={(event) => change(event.target.value)}
        placeholder="O'quvchi haqida kuzatuvlar: kuchli tomonlari, e'tibor berish kerak bo'lgan jihatlar..."
        className="bg-white dark:bg-slate-900/40"
      />
    </section>
  )
}

export function StudentDrawer({ studentId }: { studentId: string }) {
  const student = useApp((s) => s.students.find((st) => st.id === studentId))
  const group = useApp((s) => s.groups.find((g) => g.id === student?.groupId))
  const attendance = useApp((s) => s.attendance)
  const extras = useApp((s) => s.extraLessons)
  const assessments = useApp((s) => s.assessments)
  const grades = useApp((s) => s.grades)
  const assignments = useApp((s) => s.assignments)
  const submissions = useApp((s) => s.submissions)
  const tests = useApp((s) => s.tests)
  const metrics = useStudentMetrics().get(studentId)

  const history = useMemo(() => {
    const items: { date: DateKey; status: AttendanceStatus; homework?: boolean }[] = []
    for (const [key, record] of Object.entries(attendance)) {
      const mark = record[studentId]
      if (!mark) continue
      const info = lessonKeyInfo(key, extras)
      if (info) items.push({ date: info.date, status: mark.status, homework: mark.homework })
    }
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(-20)
  }, [attendance, extras, studentId])

  const recentGrades = useMemo(() => {
    if (!student) return []
    const inputs = { assessments, grades, assignments, submissions, tests }
    return gradeColumns(student.groupId, inputs)
      .map((column) => ({ column, value: gradeFor(column, studentId, inputs) }))
      .filter((item): item is { column: typeof item.column; value: number } => item.value !== null)
      .sort((a, b) => b.column.date.localeCompare(a.column.date))
      .slice(0, 8)
  }, [student, studentId, assessments, grades, assignments, submissions, tests])

  if (!student) {
    return (
      <Drawer open onClose={closeDrawer} title="O'quvchi topilmadi">
        <EmptyState icon={UserRound} title="O'quvchi topilmadi" message="Bu o'quvchi o'chirilgan bo'lishi mumkin." />
      </Drawer>
    )
  }

  const name = fullName(student)
  const age = student.birthDate ? Math.floor(diffDays(todayKey(), student.birthDate) / 365.25) : null
  const rate = metrics?.attendanceRate ?? null

  const remove = async () => {
    const ok = await confirmAction({
      title: "O'quvchini guruhdan chiqarish",
      message: `${name} «${group?.name ?? ''}» guruhidan chiqariladi. Davomat va baholar tarixi saqlanib qoladi.`,
      confirmLabel: 'Chiqarish',
    })
    if (ok) runWithUndo("O'quvchi guruhdan chiqarildi", () => removeFromGroup(student.id), name)
  }

  const destroy = async () => {
    const ok = await confirmAction({
      title: "O'quvchini butunlay o'chirish",
      message: `${name} va uning barcha davomat, baho va javoblari o'chiriladi. Bu amalni ortga qaytarish uchun faqat bir necha soniya bo'ladi.`,
      confirmLabel: "O'chirish",
    })
    if (!ok) return
    closeDrawer()
    runWithUndo("O'quvchi o'chirildi", () => deleteStudent(student.id), name)
  }

  const moreItems = [
    ...(student.status === 'active'
      ? [
          { id: 'transfer', label: "Boshqa guruhga o'tkazish", icon: ArrowRightLeft, onSelect: () => openModal({ type: 'student-transfer', studentId: student.id }) },
          { id: 'remove', label: 'Guruhdan chiqarish', icon: UserMinus, onSelect: () => void remove() },
        ]
      : []),
    ...(student.status === 'left'
      ? [
          {
            id: 'restore',
            label: 'Guruhga qaytarish',
            icon: UserRoundCheck,
            onSelect: () => {
              restoreStudent(student.id)
              notify.success("O'quvchi guruhga qaytarildi", name)
            },
          },
        ]
      : []),
    { id: 'delete', label: "Butunlay o'chirish", icon: Trash2, tone: 'danger' as const, divider: true, onSelect: () => void destroy() },
  ]

  return (
    <Drawer
      open
      onClose={closeDrawer}
      title={name}
      size="lg"
      header={
        <div className="flex items-center gap-3.5">
          <Avatar name={name} color={student.color} size="xl" variant="solid" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900 dark:text-white">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {group ? (
                <Badge color={group.color} size="xs" icon={Users}>
                  {group.name} · {group.course}
                </Badge>
              ) : null}
              <StudentStatusBadge status={student.status} size="xs" />
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <Menu label="Qo'shimcha amallar" items={moreItems} placement="top-start" size="md" triggerClassName="mr-auto border border-slate-200 dark:border-slate-700" />
          <Button variant="secondary" icon={PencilLine} onClick={() => openModal({ type: 'student-form', studentId: student.id })}>
            Tahrirlash
          </Button>
          <Button icon={MessageCircle} onClick={() => openModal({ type: 'compose', target: { kind: 'student', id: student.id } })}>
            Xabar yozish
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {metrics?.atRisk ? (
          <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">E'tibor talab qiladi</p>
              <p className="text-xs">{metrics.riskReasons.join(' · ')}. Ota-onasi bilan bog'lanish tavsiya etiladi.</p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Kpi label="Davomat" value={rate === null ? '—' : `${Math.round(rate)}%`} progress={rate} tone={rateTone(rate)} hint={metrics ? `${metrics.attendance.total} ta dars` : undefined} />
          <Kpi label="O'rtacha baho" value={formatScore(metrics?.gradeAverage ?? null)} hint={`${metrics?.gradeCount ?? 0} ta baho`} tone="blue" />
          <Kpi
            label="Topshiriqlar"
            value={`${metrics?.assignmentsDone ?? 0}/${metrics?.assignmentsTotal ?? 0}`}
            progress={metrics && metrics.assignmentsTotal > 0 ? (metrics.assignmentsDone / metrics.assignmentsTotal) * 100 : null}
            tone="violet"
          />
          <Kpi
            label="Uy vazifasi"
            value={metrics?.homeworkRate === null || metrics?.homeworkRate === undefined ? '—' : `${Math.round(metrics.homeworkRate)}%`}
            progress={metrics?.homeworkRate}
            tone="amber"
          />
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              So'nggi darslar davomati
            </h3>
            <span className="flex items-center gap-2 text-[11px] text-slate-400">
              {(['present', 'late', 'excused', 'absent'] as const).map((status) => (
                <span key={status} className="inline-flex items-center gap-1">
                  <span className={cn('h-2 w-2 rounded-sm', statusCell[status])} />
                  {attendanceLabel[status]}
                </span>
              ))}
            </span>
          </div>
          {history.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {history.map((item, index) => (
                <span
                  key={`${item.date}-${index}`}
                  title={`${formatDayMonth(item.date)}: ${attendanceLabel[item.status]}${item.homework === undefined ? '' : item.homework ? ', uy vazifasi bajarilgan' : ', uy vazifasi bajarilmagan'}`}
                  className={cn('flex h-9 w-9 flex-col items-center justify-center rounded-lg text-[10px] font-semibold leading-none text-white', statusCell[item.status])}
                >
                  {item.date.slice(8, 10)}
                  <span className="mt-0.5 text-[8px] font-medium opacity-80">{item.date.slice(5, 7)}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Davomat ma'lumotlari hali yo'q.</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            So'nggi baholar
          </h3>
          {recentGrades.length > 0 ? (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-700/60 dark:border-slate-700">
              {recentGrades.map(({ column, value }) => (
                <li key={column.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{column.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {column.typeLabel} · {formatNumericDate(column.date)}
                    </p>
                  </div>
                  <ScoreBadge value={value} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Hali baho qo'yilmagan.</p>
          )}
          {recentGrades.length > 0 ? (
            <p className="mt-1.5 text-[11px] text-slate-400">
              Oxirgi baho: {formatGrade(recentGrades[0].value)} · barcha baholar «Baholashlar» sahifasida
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200 px-3.5 py-1.5 dark:border-slate-700">
          <ContactRow icon={Phone} label="Telefon" value={student.phone} href={phoneHref(student.phone)} />
          <ContactRow icon={UserRound} label="Ota-ona" value={student.parentName} />
          <ContactRow
            icon={Phone}
            label="Ota-ona telefoni"
            value={student.parentPhone}
            href={student.parentPhone ? phoneHref(student.parentPhone) : undefined}
          />
          <ContactRow icon={Cake} label="Tug'ilgan sana" value={student.birthDate ? `${formatDate(student.birthDate)}${age !== null ? ` (${age} yosh)` : ''}` : ''} />
          <ContactRow icon={GraduationCap} label="Guruhga qo'shilgan" value={formatDate(student.joinedAt)} />
          {student.leftAt ? <ContactRow icon={UserMinus} label="Guruhdan chiqqan" value={formatDate(student.leftAt)} /> : null}
          <div className="flex flex-wrap gap-2 border-t border-slate-100 py-2.5 dark:border-slate-700/60">
            <Button size="sm" variant="soft" icon={Mail} onClick={() => openModal({ type: 'compose', target: { kind: 'parent', id: student.id } })}>
              Ota-onaga yozish
            </Button>
            <Button size="sm" variant="secondary" icon={ClipboardList} onClick={() => openModal({ type: 'assignment-form', groupId: student.groupId })}>
              Topshiriq berish
            </Button>
          </div>
        </section>

        <TeacherNote key={student.id} studentId={student.id} initial={student.note} />
      </div>
    </Drawer>
  )
}
