import { useMemo } from 'react'
import type { Option } from '../types'
import { useApp } from '../store/appStore'

/** Guruh tanlash ro'yxati (standart: faqat faol guruhlar) */
export function useGroupOptions(options: { includeCompleted?: boolean; allLabel?: string } = {}): Option[] {
  const groups = useApp((s) => s.groups)
  const { includeCompleted = false, allLabel } = options
  return useMemo(() => {
    const list = groups
      .filter((g) => includeCompleted || g.status === 'active')
      .map((g) => ({ value: g.id, label: `${g.name} · ${g.course}${g.status === 'completed' ? ' (tugagan)' : ''}` }))
    return allLabel ? [{ value: 'all', label: allLabel }, ...list] : list
  }, [groups, includeCompleted, allLabel])
}
