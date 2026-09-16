export type ClassValue = string | false | null | undefined | 0

/** Shartli Tailwind sinflarini birlashtiradi: cn('a', ok && 'b') */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
