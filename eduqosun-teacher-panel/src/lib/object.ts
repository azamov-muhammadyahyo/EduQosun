/** Qiymati `undefined` bo'lmagan maydonlarni qaytaradi (qisman yangilash uchun) */
export function definedEntries<T extends object>(patch: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key of Object.keys(patch) as (keyof T)[]) {
    if (patch[key] !== undefined) result[key] = patch[key]
  }
  return result
}

/** Ichma-ich yozuvdan bitta kalitni olib tashlaydi: { a: { x, y } } → { a: { y } } */
export function omitNested<T>(record: Record<string, Record<string, T>>, innerKey: string): Record<string, Record<string, T>> {
  const result: Record<string, Record<string, T>> = {}
  for (const [key, inner] of Object.entries(record)) {
    if (innerKey in inner) {
      const copy = { ...inner }
      delete copy[innerKey]
      result[key] = copy
    } else {
      result[key] = inner
    }
  }
  return result
}
