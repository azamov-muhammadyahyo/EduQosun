import { Activity, Clock, Keyboard, Trash2 } from 'lucide-react'
import { formatDateTime } from '../../lib/date'
import { useApp } from '../../store/appStore'
import { clearActivity } from '../../store/actions/feed'
import { runWithUndo } from '../../store/actions/undo'
import { activityMeta } from '../shared/activityMeta'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { IconBox } from '../ui/IconBox'
import { Kbd } from '../ui/Misc'
import { Modal } from '../ui/Modal'

const shortcuts: { keys: string[]; label: string }[] = [
  { keys: ['Ctrl', 'K'], label: 'Qidiruv va buyruqlar paneli' },
  { keys: ['/'], label: 'Qidiruvni ochish' },
  { keys: ['R'], label: "Tasodifiy o'quvchi tanlash" },
  { keys: ['T'], label: 'Dars taymeri' },
  { keys: ['N'], label: 'Yangi eslatma' },
  { keys: ['D'], label: "Yorug'/tungi mavzuni almashtirish" },
  { keys: ['?'], label: 'Shu oynani ochish' },
  { keys: ['Esc'], label: 'Oynani yopish' },
  { keys: ['Alt', '1…9'], label: "Menyudagi sahifalarga o'tish" },
]

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Klaviatura yorliqlari" description="Tez ishlash uchun qulay tugmalar" icon={Keyboard} size="sm">
      <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.label} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-slate-600 dark:text-slate-300">{shortcut.label}</span>
            <span className="flex shrink-0 items-center gap-1">
              {shortcut.keys.map((key, index) => (
                <span key={key} className="inline-flex items-center gap-1">
                  {index > 0 ? <span className="text-xs text-slate-400">+</span> : null}
                  <Kbd>{key}</Kbd>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

export function ActivityLogModal({ onClose }: { onClose: () => void }) {
  const activity = useApp((s) => s.activity)
  return (
    <Modal
      open
      onClose={onClose}
      title="Faoliyat tarixi"
      description="Tizimdagi so'nggi harakatlar"
      icon={Activity}
      size="md"
      footer={
        <>
          <Button
            variant="danger-soft"
            icon={Trash2}
            className="sm:mr-auto"
            disabled={activity.length === 0}
            onClick={() => runWithUndo('Faoliyat tarixi tozalandi', clearActivity)}
          >
            Tozalash
          </Button>
          <Button onClick={onClose}>Yopish</Button>
        </>
      }
    >
      {activity.length === 0 ? (
        <EmptyState icon={Activity} title="Faoliyat yo'q" message="Guruh, dars, baho va xabarlar bilan bog'liq harakatlar shu yerda ko'rinadi." />
      ) : (
        <ol className="space-y-1">
          {activity.map((item) => {
            const meta = activityMeta[item.kind]
            return (
              <li key={item.id} className="flex gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <IconBox icon={meta.icon} color={meta.color} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {item.actor ? <span className="font-semibold text-slate-900 dark:text-white">{item.actor} </span> : null}
                    {item.text}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-slate-400">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Modal>
  )
}
