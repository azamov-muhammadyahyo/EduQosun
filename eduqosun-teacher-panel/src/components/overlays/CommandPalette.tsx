import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  BellPlus,
  CalendarPlus,
  ClipboardList,
  CornerDownLeft,
  FileQuestion,
  Moon,
  Search,
  Send,
  Shuffle,
  Timer,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { AccentColor } from '../../types'
import { allNav } from '../../data/navigation'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { matchesQuery } from '../../lib/text'
import { useTheme } from '../../context/ThemeContext'
import { fullName } from '../../domain/students'
import { useFocusTrap, useLockBodyScroll } from '../../hooks/useDom'
import { useGroupMap, useLessonsOn } from '../../hooks/useData'
import { navigate, navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { closePalette, openDrawer, openModal, useUI } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Kbd } from '../ui/Misc'

interface PaletteItem {
  id: string
  section: string
  label: string
  sublabel?: string
  keywords?: string
  visual: ReactNode
  run: () => void
}

function IconVisual({ icon: Icon, color }: { icon: LucideIcon; color: AccentColor }) {
  return (
    <span className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', accent[color].iconBg, accent[color].iconText)}>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  )
}

const SECTION_LIMIT = 6

function PaletteContent() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  useLockBodyScroll(true)
  useFocusTrap(panelRef, true)

  const { toggleTheme } = useTheme()
  const { today } = useClock()
  const groups = useApp((s) => s.groups)
  const students = useApp((s) => s.students)
  const assignments = useApp((s) => s.assignments)
  const tests = useApp((s) => s.tests)
  const groupMap = useGroupMap()
  const todayLessons = useLessonsOn(today)

  const items = useMemo<PaletteItem[]>(() => {
    const actions: PaletteItem[] = [
      { id: 'a-group', section: 'Tezkor amallar', label: 'Yangi guruh yaratish', keywords: 'guruh ochish', visual: <IconVisual icon={Users} color="blue" />, run: () => openModal({ type: 'group-form' }) },
      { id: 'a-student', section: 'Tezkor amallar', label: "O'quvchi qo'shish", keywords: 'yangi oquvchi', visual: <IconVisual icon={UserPlus} color="green" />, run: () => openModal({ type: 'student-form' }) },
      { id: 'a-lesson', section: 'Tezkor amallar', label: "Dars qo'shish / jadval tuzish", keywords: 'dars jadval', visual: <IconVisual icon={CalendarPlus} color="violet" />, run: () => openModal({ type: 'lesson-form' }) },
      { id: 'a-task', section: 'Tezkor amallar', label: 'Topshiriq berish', keywords: 'vazifa uy ishi', visual: <IconVisual icon={ClipboardList} color="amber" />, run: () => openModal({ type: 'assignment-form' }) },
      { id: 'a-test', section: 'Tezkor amallar', label: 'Test yaratish', keywords: 'savol imtihon', visual: <IconVisual icon={FileQuestion} color="indigo" />, run: () => openModal({ type: 'test-builder' }) },
      { id: 'a-message', section: 'Tezkor amallar', label: 'Xabar yuborish', keywords: 'sms chat', visual: <IconVisual icon={Send} color="rose" />, run: () => openModal({ type: 'compose' }) },
      { id: 'a-reminder', section: 'Tezkor amallar', label: "Eslatma qo'shish", keywords: 'reja todo', visual: <IconVisual icon={BellPlus} color="orange" />, run: () => openModal({ type: 'reminder-form' }) },
      { id: 'a-random', section: 'Tezkor amallar', label: "Tasodifiy o'quvchi tanlash", keywords: 'random', visual: <IconVisual icon={Shuffle} color="teal" />, run: () => openModal({ type: 'random-picker' }) },
      { id: 'a-timer', section: 'Tezkor amallar', label: 'Dars taymeri', keywords: 'vaqt soat', visual: <IconVisual icon={Timer} color="sky" />, run: () => openModal({ type: 'timer' }) },
      { id: 'a-theme', section: 'Tezkor amallar', label: "Mavzuni almashtirish (yorug'/tungi)", keywords: 'dark light rejim', visual: <IconVisual icon={Moon} color="slate" />, run: toggleTheme },
    ]

    const pages: PaletteItem[] = allNav.map((item) => ({
      id: `p-${item.id}`,
      section: 'Sahifalar',
      label: item.label,
      visual: <IconVisual icon={item.icon} color="blue" />,
      run: () => navigateTo(item.id),
    }))

    const lessonItems: PaletteItem[] = todayLessons.map((lesson) => {
      const group = groupMap.get(lesson.groupId)
      return {
        id: `l-${lesson.key}`,
        section: 'Bugungi darslar',
        label: `${lesson.start} – ${lesson.end} · ${group?.name ?? ''}`,
        sublabel: lesson.topic,
        keywords: `${group?.subject ?? ''} ${group?.course ?? ''}`,
        visual: <IconVisual icon={CalendarPlus} color={group?.color ?? 'blue'} />,
        run: () => openDrawer({ type: 'lesson', lessonKey: lesson.key }),
      }
    })

    const groupItems: PaletteItem[] = groups.map((group) => ({
      id: `g-${group.id}`,
      section: 'Guruhlar',
      label: `${group.name} · ${group.course}`,
      sublabel: `${group.direction} · ${group.code}`,
      keywords: group.subject,
      visual: <IconVisual icon={Users} color={group.status === 'active' ? group.color : 'slate'} />,
      run: () => navigate(`groups/${group.id}`),
    }))

    const studentItems: PaletteItem[] = students
      .filter((student) => student.status === 'active' || student.status === 'graduated')
      .map((student) => ({
        id: `s-${student.id}`,
        section: "O'quvchilar",
        label: fullName(student),
        sublabel: `${groupMap.get(student.groupId)?.name ?? ''} · ${student.phone}`,
        keywords: `${student.parentName} ${student.phone.replace(/\s/g, '')}`,
        visual: <Avatar name={fullName(student)} color={student.color} size="xs" />,
        run: () => openDrawer({ type: 'student', studentId: student.id }),
      }))

    const taskItems: PaletteItem[] = assignments.map((assignment) => ({
      id: `h-${assignment.id}`,
      section: 'Topshiriqlar',
      label: assignment.title,
      sublabel: groupMap.get(assignment.groupId)?.name,
      visual: <IconVisual icon={ClipboardList} color="amber" />,
      run: () => openDrawer({ type: 'assignment-review', assignmentId: assignment.id }),
    }))

    const testItems: PaletteItem[] = tests.map((test) => ({
      id: `t-${test.id}`,
      section: 'Testlar',
      label: test.title,
      sublabel: groupMap.get(test.groupId)?.name,
      visual: <IconVisual icon={FileQuestion} color="indigo" />,
      run: () =>
        test.status === 'draft' ? openModal({ type: 'test-builder', testId: test.id }) : openDrawer({ type: 'test-results', testId: test.id }),
    }))

    return [...actions, ...pages, ...lessonItems, ...groupItems, ...studentItems, ...taskItems, ...testItems]
  }, [assignments, groupMap, groups, students, tests, todayLessons, toggleTheme])

  const results = useMemo(() => {
    const q = query.trim()
    const filtered = q
      ? items.filter((item) => matchesQuery(q, item.label, item.sublabel, item.keywords, item.section))
      : items.filter((item) => ['Tezkor amallar', 'Bugungi darslar', 'Sahifalar'].includes(item.section))
    // Har bo'limdan cheklangan miqdorda
    const counts = new Map<string, number>()
    return filtered.filter((item) => {
      const count = counts.get(item.section) ?? 0
      counts.set(item.section, count + 1)
      return q ? count < SECTION_LIMIT : item.section !== 'Sahifalar' || count < 12
    })
  }, [items, query])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const run = (item: PaletteItem | undefined) => {
    if (!item) return
    closePalette()
    item.run()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (results.length ? (i + 1) % results.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      run(results[active])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closePalette()
    }
  }

  let lastSection = ''
  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center px-3 pt-[10vh]">
      <div className="absolute inset-0 animate-overlay-in bg-slate-900/50 backdrop-blur-[2px]" onClick={closePalette} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Qidiruv va buyruqlar"
        onKeyDown={onKeyDown}
        className="relative flex max-h-[76vh] w-full max-w-2xl animate-pop-in flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-overlay dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-700/60">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            data-autofocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="O'quvchi, guruh, dars yoki amalni qidiring..."
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
          />
          <Kbd>Esc</Kbd>
        </div>

        <div ref={listRef} id="palette-results" role="listbox" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hech narsa topilmadi</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Boshqa so'z bilan qidirib ko'ring.</p>
            </div>
          ) : (
            results.map((item, index) => {
              const header = item.section !== lastSection ? item.section : null
              lastSection = item.section
              return (
                <div key={item.id}>
                  {header ? (
                    <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{header}</p>
                  ) : null}
                  <button
                    type="button"
                    id={`palette-${item.id}`}
                    role="option"
                    aria-selected={index === active}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => run(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                      index === active ? 'bg-blue-50 dark:bg-blue-500/10' : '',
                    )}
                  >
                    {item.visual}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
                      {item.sublabel ? (
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.sublabel}</span>
                      ) : null}
                    </span>
                    {index === active ? <CornerDownLeft className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" /> : null}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/30 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> tanlash
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Enter</Kbd> ochish
          </span>
          <span className="ml-auto hidden sm:inline">
            Maslahat: <Kbd>/</Kbd> yoki <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> bilan istalgan joydan oching
          </span>
        </div>
      </div>
    </div>
  )
}

/** Global qidiruv va buyruqlar paneli */
export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen)
  if (!open) return null
  return createPortal(<PaletteContent />, document.body)
}
