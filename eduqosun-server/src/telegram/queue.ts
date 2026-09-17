/*
 * Har bir chat uchun ketma-ket yuborish navbati.
 * Shaxsiy akkaunt spamga o'xshab qolmasligi uchun xabarlar orasida kichik tanaffus qilinadi.
 */

const GAP_MS = 800

const tails = new Map<string, Promise<void>>()

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve()
  const result = previous.then(task)
  const tail = result.then(
    () => delay(GAP_MS),
    () => delay(GAP_MS),
  )
  tails.set(key, tail)
  void tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key)
  })
  return result
}
