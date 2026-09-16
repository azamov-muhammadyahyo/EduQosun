import type { Group } from '../../types'
import { cn } from '../../lib/cn'
import { GroupTile } from '../ui/GroupIcon'
import { Select } from '../ui/Form'

interface GroupSwitcherProps {
  groups: Group[]
  value: string
  onChange: (groupId: string) => void
  /** Guruh nomi yonidagi qo'shimcha raqam (masalan, tekshirilmaganlar soni) */
  badges?: Record<string, number>
  className?: string
}

/** Guruhlar orasida almashish: keng ekranda plitkalar, torda — select */
export function GroupSwitcher({ groups, value, onChange, badges, className }: GroupSwitcherProps) {
  return (
    <div className={className}>
      <Select
        className="md:hidden"
        value={value}
        onChange={onChange}
        aria-label="Guruh"
        options={groups.map((g) => ({ value: g.id, label: `${g.name} · ${g.course}` }))}
      />
      <div role="tablist" aria-label="Guruhlar" className="scrollbar-none hidden gap-2 overflow-x-auto md:flex md:flex-wrap">
        {groups.map((group) => {
          const active = group.id === value
          const badge = badges?.[group.id] ?? 0
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(group.id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl border py-1.5 pl-1.5 pr-3 text-left transition-all',
                active
                  ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500 dark:border-blue-400 dark:bg-blue-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/60',
              )}
            >
              <GroupTile icon={group.icon} color={group.color} size="sm" muted={group.status === 'completed'} />
              <span className="min-w-0">
                <span className={cn('block text-sm font-semibold', active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100')}>
                  {group.name}
                </span>
                <span className="block max-w-[120px] truncate text-[11px] text-slate-500 dark:text-slate-400">{group.course}</span>
              </span>
              {badge > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-amber-950">
                  {badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
