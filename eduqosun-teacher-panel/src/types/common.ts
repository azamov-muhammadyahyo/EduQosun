/** Ikonka konteynerlari, belgilar va guruh ranglari uchun kalitlar */
export type AccentColor =
  | 'blue'
  | 'green'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'orange'
  | 'slate'
  | 'teal'
  | 'pink'
  | 'indigo'

/** Mahalliy sana: 'YYYY-MM-DD' */
export type DateKey = string

/** Kun vaqti: 'HH:MM' */
export type TimeString = string

/** Hafta kuni: 1 = Dushanba … 7 = Yakshanba */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Tanlov ro'yxatlari (select, tab) uchun umumiy element */
export interface Option<T extends string = string> {
  value: T
  label: string
}
