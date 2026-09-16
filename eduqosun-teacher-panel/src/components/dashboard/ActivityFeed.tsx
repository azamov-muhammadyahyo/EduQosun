import { Bell, Clock } from 'lucide-react'
import { formatTimeAgo } from '../../lib/date'
import { useApp } from '../../store/appStore'
import { useNow } from '../../store/clock'
import { openModal } from '../../store/uiStore'
import { activityMeta } from '../shared/activityMeta'
import { EmptyState } from '../ui/EmptyState'
import { IconBox } from '../ui/IconBox'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'

const LIMIT = 5

/** So'nggi faoliyat — vaqt chizig'i ko'rinishida */
export function ActivityFeed() {
  const activity = useApp((s) => s.activity)
  const now = useNow()
  const items = activity.slice(0, LIMIT)
  const lastIndex = items.length - 1

  return (
    <SectionCard
      title="So'nggi faoliyat"
      icon={Bell}
      action={<SeeAllLink onClick={() => openModal({ type: 'activity-log' })} />}
      className="h-full"
      bodyClassName="px-5 py-4"
    >
      {items.length === 0 ? (
        <EmptyState icon={Bell} message="Hozircha faoliyat yo'q" compact />
      ) : (
        <ol>
          {items.map((item, index) => {
            const meta = activityMeta[item.kind]
            const isLast = index === lastIndex
            return (
              <li key={item.id} className={`relative flex gap-3 ${isLast ? '' : 'pb-5'}`}>
                {!isLast ? <span className="absolute bottom-1 left-[17.5px] top-10 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" /> : null}
                <IconBox icon={meta.icon} color={meta.color} size="sm" />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {item.actor ? <span className="font-semibold text-slate-900 dark:text-white">{item.actor} </span> : null}
                    {item.text}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs tabular-nums text-slate-400">
                    <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {formatTimeAgo(item.createdAt, now)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </SectionCard>
  )
}
