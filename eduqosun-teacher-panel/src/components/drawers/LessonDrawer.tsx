import { useMemo } from 'react'
import {
  BookOpenCheck,
  CalendarCheck,
  CalendarDays,
  CalendarX2,
  Clock,
  DoorOpen,
  Hash,
  NotebookPen,
  PencilLine,
  Send,
  Shuffle,
  Split,
  Timer,
  Undo2,
  Users,
} from 'lucide-react'
import { attendanceLabel, lessonKindLabel } from '../../data/catalog'
import { formatDateWithWeekday, formatDuration } from '../../lib/date'
import { percent } from '../../lib/format'
import { attendanceRate, summarize } from '../../domain/attendance'
import { lessonDuration, lessonPhase } from '../../domain/lessons'
import { rosterOn } from '../../domain/students'
import { useLesson } from '../../hooks/useData'
import { navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { setLessonCanceled, updateLesson } from '../../store/actions/lessons'
import { notify } from '../../store/toastStore'
import { closeDrawer, confirmAction, openModal } from '../../store/uiStore'
import { EditableText } from '../shared/EditableText'
import { StackedBar } from '../shared/StackedBar'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { EmptyState } from '../ui/EmptyState'
import { GroupCodeTile } from '../ui/GroupIcon'
import { LessonPhaseBadge } from '../ui/StatusBadges'

function InfoTile({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  )
}

export function LessonDrawer({ lessonKey }: { lessonKey: string }) {
  const lesson = useLesson(lessonKey)
  const group = useApp((s) => s.groups.find((g) => g.id === lesson?.groupId))
  const students = useApp((s) => s.students)
  const record = useApp((s) => s.attendance[lessonKey])
  const { today, minutes } = useClock()

  const roster = useMemo(() => (lesson ? rosterOn(students, lesson.groupId, lesson.date) : []), [students, lesson])
  const summary = useMemo(() => summarize(record, new Set(roster.map((s) => s.id))), [record, roster])

  if (!lesson || !group) {
    return (
      <Drawer open onClose={closeDrawer} title="Dars topilmadi">
        <EmptyState icon={CalendarX2} title="Dars topilmadi" message="Bu dars o'chirilgan yoki jadval o'zgargan bo'lishi mumkin." />
      </Drawer>
    )
  }

  const phase = lessonPhase(lesson, today, minutes)
  const future = phase === 'planned' || phase === 'upcoming'
  const rate = attendanceRate(summary)

  const openAttendance = () => {
    closeDrawer()
    navigateTo('attendance', null, { group: group.id, date: lesson.date, lesson: lesson.key })
  }

  const toggleCancel = async () => {
    if (!lesson.canceled) {
      const ok = await confirmAction({
        title: 'Darsni bekor qilish',
        message: `${group.name} guruhining ${formatDateWithWeekday(lesson.date)}, ${lesson.start} dagi darsi bekor qilinadi. O'quvchilarga xabar yuborishni unutmang.`,
        confirmLabel: 'Bekor qilish',
        cancelLabel: 'Ortga',
      })
      if (!ok) return
      setLessonCanceled(lesson.key, true)
      notify.warning('Dars bekor qilindi', "Guruhga xabar yuborish uchun «Guruhga xabar» tugmasidan foydalaning.")
    } else {
      setLessonCanceled(lesson.key, false)
      notify.success('Dars qayta tiklandi')
    }
  }

  const tools = [
    { label: "Tasodifiy o'quvchi", icon: Shuffle, onClick: () => openModal({ type: 'random-picker', groupId: group.id }) },
    { label: 'Taymer', icon: Timer, onClick: () => openModal({ type: 'timer' }) },
    { label: "Jamoalarga bo'lish", icon: Split, onClick: () => openModal({ type: 'team-splitter', groupId: group.id }) },
    {
      label: 'Guruhga xabar',
      icon: Send,
      onClick: () =>
        openModal({
          type: 'compose',
          target: { kind: 'group', id: group.id },
          text: lesson.canceled
            ? `Diqqat! ${formatDateWithWeekday(lesson.date)}, soat ${lesson.start} dagi dars bekor qilindi.`
            : `${formatDateWithWeekday(lesson.date)}, soat ${lesson.start} — «${lesson.topic}» mavzusidagi dars.`,
        }),
    },
  ]

  return (
    <Drawer
      open
      onClose={closeDrawer}
      title={`${group.name} — dars tafsilotlari`}
      header={
        <div className="flex items-center gap-3">
          <GroupCodeTile name={group.name} color={group.color} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
              {group.name} ({group.direction})
            </p>
            <p className="truncate text-[13px] text-slate-500 dark:text-slate-400">
              {group.subject} · {lessonKindLabel[lesson.kind]}
            </p>
          </div>
          <div className="ml-auto hidden sm:block">
            <LessonPhaseBadge phase={phase} />
          </div>
        </div>
      }
      footer={
        <>
          <Button
            variant={lesson.canceled ? 'soft' : 'danger-soft'}
            icon={lesson.canceled ? Undo2 : CalendarX2}
            className="mr-auto"
            onClick={() => void toggleCancel()}
          >
            {lesson.canceled ? 'Tiklash' : 'Bekor qilish'}
          </Button>
          <Button variant="secondary" icon={PencilLine} onClick={() => openModal({ type: 'lesson-form', lessonKey: lesson.key })}>
            Tahrirlash
          </Button>
          <Button icon={CalendarCheck} onClick={openAttendance} disabled={lesson.canceled}>
            Davomat
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="sm:hidden">
          <LessonPhaseBadge phase={phase} />
        </div>

        {lesson.canceled ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            Bu dars bekor qilingan. Davomat va baholar olinmaydi.
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5">
          <InfoTile icon={CalendarDays} label="Sana" value={formatDateWithWeekday(lesson.date)} />
          <InfoTile icon={Clock} label="Vaqt" value={`${lesson.start} – ${lesson.end} (${formatDuration(lessonDuration(lesson))})`} />
          <InfoTile icon={DoorOpen} label="Xona" value={lesson.room || '—'} />
          <InfoTile icon={Users} label="O'quvchilar" value={`${roster.length} ta`} />
          <InfoTile icon={Hash} label="Dars" value={lesson.number ? `${lesson.number}-dars` : "Qo'shimcha dars"} />
          <InfoTile icon={BookOpenCheck} label="Kurs" value={group.course} />
        </div>

        <EditableText
          label="Mavzu"
          icon={BookOpenCheck}
          value={lesson.topic}
          placeholder="Mavzu kiritilmagan"
          maxLength={100}
          onSave={(topic) => {
            if (!topic) return notify.error("Mavzu bo'sh bo'lmasligi kerak")
            updateLesson(lesson.key, { topic })
            notify.success('Mavzu saqlandi')
          }}
        />
        <EditableText
          label="Uy vazifasi"
          icon={NotebookPen}
          value={lesson.homework}
          placeholder="Uy vazifasi berilmagan"
          multiline
          onSave={(homework) => {
            updateLesson(lesson.key, { homework })
            notify.success('Uy vazifasi saqlandi')
          }}
        />
        <EditableText
          label="Izoh (faqat sizga)"
          icon={PencilLine}
          value={lesson.notes}
          placeholder="Dars rejasi yoki eslatmalar yo'q"
          multiline
          onSave={(notes) => {
            updateLesson(lesson.key, { notes })
            notify.success('Izoh saqlandi')
          }}
        />

        <section className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Davomat
            </h3>
            {summary.total > 0 ? (
              <span className="text-sm font-bold text-slate-900 dark:text-white">{rate === null ? '—' : `${Math.round(rate)}%`}</span>
            ) : null}
          </div>
          {summary.total > 0 ? (
            <>
              <StackedBar
                segments={[
                  { id: 'present', value: summary.present, fillClass: 'fill-emerald-500', label: attendanceLabel.present },
                  { id: 'late', value: summary.late, fillClass: 'fill-amber-400', label: attendanceLabel.late },
                  { id: 'excused', value: summary.excused, fillClass: 'fill-sky-400', label: attendanceLabel.excused },
                  { id: 'absent', value: summary.absent, fillClass: 'fill-rose-500', label: attendanceLabel.absent },
                ]}
              />
              <div className="mt-2.5 grid grid-cols-4 gap-2 text-center text-xs">
                {(
                  [
                    ['present', 'text-emerald-600 dark:text-emerald-400'],
                    ['late', 'text-amber-600 dark:text-amber-400'],
                    ['excused', 'text-sky-600 dark:text-sky-400'],
                    ['absent', 'text-rose-600 dark:text-rose-400'],
                  ] as const
                ).map(([key, tone]) => (
                  <div key={key}>
                    <p className={`text-base font-bold ${tone}`}>{summary[key]}</p>
                    <p className="text-slate-500 dark:text-slate-400">{attendanceLabel[key]}</p>
                  </div>
                ))}
              </div>
              {summary.homeworkChecked > 0 ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Uy vazifasi: {summary.homeworkDone}/{summary.homeworkChecked} ({percent(summary.homeworkDone, summary.homeworkChecked)}%)
                  bajarilgan
                </p>
              ) : null}
              {summary.total < roster.length ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {roster.length - summary.total} ta o'quvchi belgilanmagan
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {lesson.canceled ? 'Dars bekor qilingan.' : future ? 'Dars hali boshlanmagan.' : 'Davomat hali olinmagan.'}
              </p>
              {!lesson.canceled ? (
                <Button size="sm" variant="soft" icon={CalendarCheck} onClick={openAttendance}>
                  Davomat olish
                </Button>
              ) : null}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dars vositalari</h3>
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <button
                key={tool.label}
                type="button"
                onClick={tool.onClick}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50/60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10"
              >
                <tool.icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                {tool.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </Drawer>
  )
}
