import { useMemo, useState } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  NotebookPen,
  TriangleAlert,
  UserCheck,
} from 'lucide-react'
import type { DateKey, Lesson } from '../types'
import {
  addMonths,
  endOfMonth,
  formatDateWithWeekday,
  formatDayMonth,
  formatMonthYear,
  formatNumericDate,
  addDays,
  isDateKey,
  startOfMonth,
} from '../lib/date'
import { downloadCsv } from '../lib/download'
import { slugify } from '../lib/text'
import { attendanceMeta } from '../components/attendance/attendanceMeta'
import { summarize } from '../domain/attendance'
import { adjacentLessonDate, findLesson, lessonPhase, lessonsInRange, lessonsOnDate } from '../domain/lessons'
import { compareStudents, fullName, isEnrolledOn, rosterOn } from '../domain/students'
import { useLessonSources, useStudentMetrics } from '../hooks/useData'
import { updateQuery, useRoute } from '../router'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { clearAttendance, markAllHomework, markAllPresent, markRemainingPresent } from '../store/actions/attendance'
import { logActivity } from '../store/actions/feed'
import { sendToTarget } from '../store/actions/messages'
import { runWithUndo } from '../store/actions/undo'
import { notify, toast } from '../store/toastStore'
import { confirmAction, openDrawer, openModal } from '../store/uiStore'
import { AttendanceSummary } from '../components/attendance/AttendanceSummary'
import { MonthlyJournal } from '../components/attendance/MonthlyJournal'
import { RollCall } from '../components/attendance/RollCall'
import { GroupSwitcher } from '../components/shared/GroupSwitcher'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Select } from '../components/ui/Form'
import { IconButton } from '../components/ui/IconButton'
import { PageHeader } from '../components/ui/PageHeader'
import { LessonPhaseBadge } from '../components/ui/StatusBadges'
import { SegmentedControl } from '../components/ui/Tabs'

type Mode = 'roll' | 'month'

const UNMARKED_WINDOW_DAYS = 14

export function AttendancePage() {
  const groups = useApp((s) => s.groups)
  const students = useApp((s) => s.students)
  const attendance = useApp((s) => s.attendance)
  const sources = useLessonSources()
  const metrics = useStudentMetrics()
  const { today, minutes } = useClock()
  const { query } = useRoute()
  const [mode, setMode] = useState<Mode>('roll')

  const activeGroups = useMemo(() => groups.filter((g) => g.status === 'active'), [groups])
  const group = activeGroups.find((g) => g.id === query.get('group')) ?? activeGroups[0]

  // So'nggi ikki haftadagi davomati olinmagan darslar (barcha guruhlar)
  const unmarked = useMemo(() => {
    const lessons = lessonsInRange(addDays(today, -UNMARKED_WINDOW_DAYS), today, { ...sources, groups: activeGroups })
    return lessons
      .filter((l) => lessonPhase(l, today, minutes) === 'held' && !attendance[l.key])
      .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
  }, [sources, activeGroups, attendance, today, minutes])

  const unmarkedByGroup = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const lesson of unmarked) counts[lesson.groupId] = (counts[lesson.groupId] ?? 0) + 1
    return counts
  }, [unmarked])

  const groupSources = useMemo(
    () => (group ? { ...sources, groups: [group], extras: sources.extras.filter((e) => e.groupId === group.id) } : null),
    [sources, group],
  )

  // Qaysi dars: havoladagi `lesson` → `date` → bugun → oxirgi o'tgan dars
  const { date, dayLessons, lesson } = useMemo(() => {
    if (!group || !groupSources) return { date: today, dayLessons: [] as Lesson[], lesson: null }
    const requestedKey = query.get('lesson')
    const requested = requestedKey ? findLesson(requestedKey, sources) : null
    const rawDate = query.get('date') ?? ''
    let target: DateKey = requested && requested.groupId === group.id ? requested.date : isDateKey(rawDate) ? rawDate : today
    let list = lessonsOnDate(target, groupSources)
    if (list.length === 0 && !isDateKey(rawDate) && !requested) {
      target = adjacentLessonDate(group, today, -1, sources) ?? today
      list = lessonsOnDate(target, groupSources)
    }
    const chosen =
      list.find((l) => l.key === requested?.key) ?? list.find((l) => !l.canceled && lessonPhase(l, today, minutes) === 'live') ?? list.find((l) => !l.canceled) ?? list[0] ?? null
    return { date: target, dayLessons: list, lesson: chosen }
  }, [group, groupSources, sources, query, today, minutes])

  const roster = useMemo(() => (group && lesson ? rosterOn(students, group.id, lesson.date) : []), [students, group, lesson])
  const record = lesson ? attendance[lesson.key] : undefined
  const summary = useMemo(() => summarize(record, new Set(roster.map((s) => s.id))), [record, roster])
  const rates = useMemo(() => new Map(roster.map((s) => [s.id, metrics.get(s.id)?.attendanceRate ?? null])), [roster, metrics])

  // Oylik jurnal
  const [month, setMonth] = useState<DateKey>(today)
  const monthLessons = useMemo(
    () => (groupSources ? lessonsInRange(startOfMonth(month), endOfMonth(month), groupSources).filter((l) => !l.canceled) : []),
    [groupSources, month],
  )
  const monthStudents = useMemo(
    () =>
      group
        ? students
            .filter((s) => s.groupId === group.id && monthLessons.some((l) => isEnrolledOn(s, l.date)))
            .sort(compareStudents)
        : [],
    [students, group, monthLessons],
  )

  if (!group || !groupSources) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Davomat" description="O'quvchilar davomatini yuritish" />
        <Card className="p-6">
          <EmptyState icon={CalendarCheck} title="Faol guruh yo'q" message="Davomat olish uchun avval guruh yarating." />
        </Card>
      </div>
    )
  }

  const future = lesson ? lesson.date > today : true
  const locked = !lesson || lesson.canceled || future
  const ids = roster.map((s) => s.id)

  const goToLesson = (target: Lesson) => updateQuery({ group: target.groupId, date: target.date, lesson: target.key })
  const goToDate = (direction: 1 | -1) => {
    const next = adjacentLessonDate(group, date, direction, sources)
    if (next) updateQuery({ date: next, lesson: null })
    else notify.info(direction === 1 ? "Keyingi dars topilmadi" : 'Oldingi dars topilmadi')
  }

  const notifyAbsent = () => {
    if (!lesson) return
    const absent = roster.filter((s) => record?.[s.id]?.status === 'absent')
    let sent = 0
    for (const student of absent) {
      const id = sendToTarget(
        { kind: 'parent', id: student.id },
        `Assalomu alaykum! Farzandingiz ${fullName(student)} ${formatDateWithWeekday(lesson.date)}, soat ${lesson.start} dagi ${group.name} guruhi darsiga kelmadi. Sababini bildirishingizni so'rayman.`,
      )
      if (id) sent += 1
    }
    logActivity('attendance', `${sent} ta ota-onaga darsga kelmaganlik haqida xabar yuborildi`)
    notify.success('Xabarlar yuborildi', `${sent} ta ota-onaga xabar jo'natildi.`)
  }

  const finish = async () => {
    if (!lesson) return
    const missing = roster.length - summary.total
    if (missing > 0) {
      const ok = await confirmAction({
        title: "Yo'qlamani yakunlash",
        message: `${missing} ta o'quvchi belgilanmagan. Ular "Keldi" deb belgilansinmi?`,
        confirmLabel: 'Ha, belgilash',
        tone: 'primary',
      })
      if (!ok) return
      markRemainingPresent(lesson.key, ids)
    }
    const final = summarize({ ...(record ?? {}), ...Object.fromEntries(ids.filter((id) => !record?.[id]).map((id) => [id, { status: 'present' as const }])) })
    logActivity('attendance', `${group.name} guruhida davomat olindi: ${final.present + final.late}/${final.total} keldi`)
    toast({
      tone: 'success',
      title: 'Davomat saqlandi',
      description: `${group.name} · ${formatDayMonth(lesson.date)}: ${final.present + final.late}/${final.total} o'quvchi keldi`,
      ...(final.absent > 0 ? { actionLabel: 'Ota-onalarga xabar', onAction: notifyAbsent } : {}),
    })
  }

  const exportMonth = () => {
    downloadCsv(`davomat-${slugify(group.name)}-${month.slice(0, 7)}`, [
      ["O'quvchi", ...monthLessons.map((l) => formatNumericDate(l.date)), 'Keldi', 'Kechikdi', 'Kelmadi', 'Sababli'],
      ...monthStudents.map((student) => {
        const marks = monthLessons.map((l) => attendance[l.key]?.[student.id]?.status)
        const count = (status: string) => marks.filter((m) => m === status).length
        return [
          fullName(student),
          ...marks.map((m) => (m ? attendanceMeta[m].short : '')),
          count('present'),
          count('late'),
          count('absent'),
          count('excused'),
        ]
      }),
    ])
    notify.success('Jurnal yuklab olindi', `${formatMonthYear(month)} · ${group.name}`)
  }

  const lessonOptions = dayLessons.map((l) => ({ value: l.key, label: `${l.start}–${l.end}${l.canceled ? ' (bekor)' : ''}` }))

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Davomat"
        description="Darsdagi yo'qlama, uy vazifasi va oylik davomat jurnali"
        actions={
          <SegmentedControl<Mode>
            label="Ko'rinish"
            value={mode}
            onChange={setMode}
            items={[
              { value: 'roll', label: "Yo'qlama", icon: UserCheck },
              { value: 'month', label: 'Oylik jurnal', icon: NotebookPen },
            ]}
          />
        }
      />

      {unmarked.length > 0 ? (
        <div className="print-hidden flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:flex-row sm:items-center">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{unmarked.length} ta darsning davomati olinmagan</p>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/80">So'nggi {UNMARKED_WINDOW_DAYS} kun ichida o'tkazilgan, lekin yo'qlama qilinmagan darslar</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unmarked.slice(0, 4).map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant="secondary"
                onClick={() => {
                  setMode('roll')
                  goToLesson(item)
                }}
              >
                {groups.find((g) => g.id === item.groupId)?.name} · {formatDayMonth(item.date)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <GroupSwitcher
        className="print-hidden"
        groups={activeGroups}
        value={group.id}
        badges={unmarkedByGroup}
        onChange={(id) => updateQuery({ group: id, date: null, lesson: null })}
      />

      {mode === 'roll' ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-700/60 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <IconButton icon={ChevronLeft} label="Oldingi dars" variant="outline" onClick={() => goToDate(-1)} />
                <div className="min-w-0 px-1">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{formatDateWithWeekday(date)}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {lesson ? `${lesson.start}–${lesson.end} · ${lesson.topic}` : "Bu kunda dars yo'q"}
                  </p>
                </div>
                <IconButton icon={ChevronRight} label="Keyingi dars" variant="outline" onClick={() => goToDate(1)} />
                {lesson ? (
                  <span className="ml-1 hidden sm:inline-flex">
                    <LessonPhaseBadge phase={lessonPhase(lesson, today, minutes)} size="xs" />
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {lessonOptions.length > 1 ? (
                  <Select size="sm" value={lesson?.key ?? ''} onChange={(key) => updateQuery({ lesson: key })} options={lessonOptions} aria-label="Dars" />
                ) : null}
                {date !== today ? (
                  <Button size="sm" variant="soft" icon={CalendarClock} onClick={() => updateQuery({ date: null, lesson: null })}>
                    Bugun
                  </Button>
                ) : null}
                {lesson ? (
                  <Button size="sm" variant="ghost" onClick={() => openDrawer({ type: 'lesson', lessonKey: lesson.key })}>
                    Dars tafsilotlari
                  </Button>
                ) : null}
              </div>
            </div>

            {!lesson ? (
              <EmptyState
                icon={CalendarX2}
                title="Bu kunda dars yo'q"
                message="Strelkalar yordamida guruhning oldingi yoki keyingi darsiga o'ting."
                action={
                  <Button variant="secondary" icon={ChevronLeft} onClick={() => goToDate(-1)}>
                    Oxirgi darsga o'tish
                  </Button>
                }
              />
            ) : (
              <>
                {lesson.canceled ? (
                  <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    Bu dars bekor qilingan — davomat olinmaydi.
                  </p>
                ) : future ? (
                  <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    Dars hali bo'lmagan. Davomatni dars kuni belgilashingiz mumkin.
                  </p>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="success" icon={CheckCheck} onClick={() => markAllPresent(lesson.key, ids)}>
                      Hammasi keldi
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const count = markRemainingPresent(lesson.key, ids)
                        notify.info(count > 0 ? `${count} ta o'quvchi "Keldi" deb belgilandi` : "Belgilanmagan o'quvchi yo'q")
                      }}
                    >
                      Qolganlar keldi
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => markAllHomework(lesson.key, ids, true)} disabled={summary.present + summary.late === 0}>
                      Vazifani hamma bajardi
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Eraser}
                      className="sm:ml-auto"
                      disabled={!record}
                      onClick={() => runWithUndo('Davomat tozalandi', () => clearAttendance(lesson.key))}
                    >
                      Tozalash
                    </Button>
                  </div>
                )}

                <div className="mt-4">
                  {roster.length === 0 ? (
                    <EmptyState icon={UserCheck} message="Bu sanada guruhda o'quvchi bo'lmagan." />
                  ) : (
                    <RollCall roster={roster} record={record} lessonKey={lesson.key} disabled={locked} rates={rates} />
                  )}
                </div>
              </>
            )}
          </Card>

          <aside className="space-y-6">
            <AttendanceSummary
              summary={summary}
              rosterSize={roster.length}
              disabled={locked}
              onFinish={() => void finish()}
              onNotifyAbsent={notifyAbsent}
              onRandom={() => openModal({ type: 'random-picker', groupId: group.id })}
            />
          </aside>
        </div>
      ) : (
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <IconButton icon={ChevronLeft} label="Oldingi oy" variant="outline" onClick={() => setMonth(addMonths(month, -1))} />
              <p className="min-w-[140px] text-center text-base font-semibold text-slate-900 dark:text-white">{formatMonthYear(month)}</p>
              <IconButton icon={ChevronRight} label="Keyingi oy" variant="outline" onClick={() => setMonth(addMonths(month, 1))} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                {Object.values(attendanceMeta).map((meta) => (
                  <span key={meta.label} className="inline-flex items-center gap-1.5">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded font-bold ${meta.cell}`}>{meta.short}</span>
                    {meta.label}
                  </span>
                ))}
              </div>
              <Button size="sm" variant="secondary" icon={Download} onClick={exportMonth} disabled={monthLessons.length === 0}>
                CSV
              </Button>
            </div>
          </div>
          {monthLessons.length === 0 || monthStudents.length === 0 ? (
            <EmptyState icon={NotebookPen} title="Bu oyda dars yo'q" message="Boshqa oyni tanlang." />
          ) : (
            <MonthlyJournal
              students={monthStudents}
              lessons={monthLessons}
              attendance={attendance}
              today={today}
              onOpenLesson={(item) => {
                setMode('roll')
                goToLesson(item)
              }}
            />
          )}
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Katakni bosib holatni almashtiring: Keldi → Kechikdi → Kelmadi → Sababli → belgisiz. Sana ustiga bosilsa, o'sha darsning yo'qlamasi ochiladi.
          </p>
        </Card>
      )}
    </div>
  )
}
