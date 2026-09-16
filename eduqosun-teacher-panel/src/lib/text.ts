/** "Bekzod Rahimov" → "BR" */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

/**
 * Qidiruv uchun normallashtirish: kichik harf, tutuq belgisining barcha shakllari olib tashlanadi
 * ("O'quvchi", "Oʻquvchi", "oquvchi" — hammasi bir xil topiladi).
 */
export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ʻʼ‘’`'´]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** So'rov barcha so'zlari maydonlardan birida uchrasa — true */
export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = normalizeSearch(query)
  if (!q) return true
  const haystack = normalizeSearch(fields.filter(Boolean).join(' '))
  return q.split(' ').every((word) => haystack.includes(word))
}

export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value
}

/** Fayl nomi uchun xavfsiz satr */
export function slugify(value: string): string {
  return (
    normalizeSearch(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'fayl'
  )
}
