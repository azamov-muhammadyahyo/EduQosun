import { memo } from 'react'
import { CalendarDays, CircleHelp, Copy, Eye, Flag, Megaphone, PencilLine, Timer, Trash2, Trophy, Users } from 'lucide-react'
import type { Group, Test, TestStatus } from '../../types'
import { testStatusLabel } from '../../data/catalog'
import { rateTone } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { formatRelativeDay } from '../../lib/date'
import type { TestSummary } from '../../domain/tests'
import { deleteTest, duplicateTest, setTestStatus } from '../../store/actions/tests'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { confirmAction, openDrawer, openModal } from '../../store/uiStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { GroupTile } from '../ui/GroupIcon'
import { Menu, type MenuItem } from '../ui/Menu'
import { ProgressBar } from '../ui/ProgressBar'

const statusColor: Record<TestStatus, 'slate' | 'blue' | 'green'> = {
  draft: 'slate',
  published: 'blue',
  finished: 'green',
}

export interface TestItem {
  test: Test
  group: Group | undefined
  summary: TestSummary
  rosterSize: number
}

export async function publishTest(test: Test): Promise<void> {
  if (test.questions.length === 0) {
    notify.error("E'lon qilib bo'lmaydi", "Testda kamida bitta savol bo'lishi kerak.")
    return
  }
  const ok = await confirmAction({
    title: "Testni e'lon qilish",
    message: `«${test.title}» o'quvchilarga ochiladi. E'londan keyin savollarni tahrirlab bo'lmaydi.`,
    confirmLabel: "E'lon qilish",
    tone: 'primary',
  })
  if (!ok) return
  setTestStatus(test.id, 'published')
  notify.success("Test e'lon qilindi", test.title)
}

function menuItems({ test }: TestItem): MenuItem[] {
  return [
    { id: 'preview', label: "Ko'rib chiqish", icon: Eye, onSelect: () => openModal({ type: 'test-preview', testId: test.id }) },
    { id: 'results', label: 'Natijalar', icon: Trophy, disabled: test.status === 'draft', onSelect: () => openDrawer({ type: 'test-results', testId: test.id }) },
    { id: 'edit', label: 'Tahrirlash', icon: PencilLine, disabled: test.status !== 'draft', onSelect: () => openModal({ type: 'test-builder', testId: test.id }) },
    {
      id: 'duplicate',
      label: 'Nusxa olish',
      icon: Copy,
      onSelect: () => {
        const copy = duplicateTest(test.id)
        if (copy) notify.success('Nusxa yaratildi', `${copy.title} — qoralama sifatida saqlandi`)
      },
    },
    {
      id: 'delete',
      label: "O'chirish",
      icon: Trash2,
      tone: 'danger',
      divider: true,
      onSelect: async () => {
        const ok = await confirmAction({
          title: "Testni o'chirish",
          message: `«${test.title}» va uning barcha natijalari o'chiriladi.`,
          confirmLabel: "O'chirish",
        })
        if (ok) runWithUndo("Test o'chirildi", () => deleteTest(test.id), test.title)
      },
    },
  ]
}

/** Test kartochkasi */
export const TestCard = memo(function TestCard({ item, today }: { item: TestItem; today: string }) {
  const { test, group, summary, rosterSize } = item
  const average = summary.averagePercent

  const primary =
    test.status === 'draft' ? (
      <Button size="sm" icon={Megaphone} onClick={() => void publishTest(test)}>
        E'lon qilish
      </Button>
    ) : test.status === 'published' ? (
      <Button
        size="sm"
        variant="secondary"
        icon={Flag}
        onClick={() => {
          setTestStatus(test.id, 'finished')
          notify.success('Test yakunlandi', `${summary.participants} ta o'quvchi qatnashdi`)
        }}
      >
        Yakunlash
      </Button>
    ) : (
      <Button size="sm" variant="soft" icon={Trophy} onClick={() => openDrawer({ type: 'test-results', testId: test.id })}>
        Natijalar
      </Button>
    )

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift dark:border-slate-700/60 dark:bg-slate-800">
      <div className="flex items-start gap-3">
        {group ? <GroupTile icon={group.icon} color={group.color} size="md" muted={test.status === 'finished'} /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge color={statusColor[test.status]} size="xs" dot pulse={test.status === 'published'}>
              {testStatusLabel[test.status]}
            </Badge>
            <Badge size="xs" icon={Users}>
              {group?.name ?? '—'}
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => (test.status === 'draft' ? openModal({ type: 'test-builder', testId: test.id }) : openDrawer({ type: 'test-results', testId: test.id }))}
            className="mt-1.5 line-clamp-2 text-left text-[15px] font-semibold leading-snug text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
          >
            {test.title}
          </button>
        </div>
        <Menu label={`${test.title} — amallar`} items={menuItems(item)} />
      </div>

      {test.description ? <p className="mt-2 line-clamp-2 text-[13px] text-slate-500 dark:text-slate-400">{test.description}</p> : null}

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
          <dt className="sr-only">Savollar</dt>
          <dd>{test.questions.length} ta savol</dd>
        </div>
        <div className="flex items-center gap-1">
          <Timer className="h-3.5 w-3.5" aria-hidden="true" />
          <dt className="sr-only">Davomiylik</dt>
          <dd>{test.durationMin} daqiqa</dd>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          <dt className="sr-only">Sana</dt>
          <dd>{formatRelativeDay(test.date, today)}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-4">
        {test.status === 'draft' ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
            Qoralama — e'lon qilinmaguncha o'quvchilarga ko'rinmaydi.
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Qatnashdi: <b className="text-slate-800 dark:text-slate-100">{summary.participants}</b>/{rosterSize}
              </span>
              <span className={cn('font-bold tabular-nums', average === null ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100')}>
                {average === null ? '—' : `${Math.round(average)}%`}
              </span>
            </div>
            <ProgressBar className="mt-1.5" value={average ?? 0} color={rateTone(average)} size="sm" label="O'rtacha natija" />
          </>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/60">
          <Button size="sm" variant="ghost" icon={Eye} onClick={() => openModal({ type: 'test-preview', testId: test.id })}>
            Ko'rish
          </Button>
          {primary}
        </div>
      </div>
    </article>
  )
})
