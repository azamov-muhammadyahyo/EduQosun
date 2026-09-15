import { Bell, Clock } from 'lucide-react'
import { activityFeed } from '../../data/activityFeed'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'
import { IconBox } from '../ui/IconBox'

/** So'nggi faoliyat (§7.13) */
export function ActivityFeed() {
  const lastIndex = activityFeed.length - 1
  return (
    <SectionCard
      title="So'nggi faoliyat"
      icon={Bell}
      action={<SeeAllLink />}
      className="h-full"
      bodyClassName="px-5 py-4"
    >
      <ol>
        {activityFeed.map((item, index) => {
          const isLast = index === lastIndex
          return (
            <li key={item.id} className={`relative flex gap-3 ${isLast ? '' : 'pb-5'}`}>
              {/* Vaqt chizig'i — ikonka markazidan keyingi ikonkagacha */}
              {!isLast ? (
                <span
                  className="absolute bottom-1 left-[17.5px] top-10 w-px bg-slate-200 dark:bg-slate-700"
                  aria-hidden="true"
                />
              ) : null}
              <IconBox icon={item.icon} color={item.color} size="sm" />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                  {item.actor ? (
                    <>
                      <span className="font-semibold text-slate-900 dark:text-white">{item.actor}</span>{' '}
                    </>
                  ) : null}
                  {item.text}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs tabular-nums text-slate-400">
                  <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {item.datetime}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </SectionCard>
  )
}
