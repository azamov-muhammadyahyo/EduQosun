export interface Random {
  /** [0, 1) */
  next: () => number
  /** [min, max] butun son */
  int: (min: number, max: number) => number
  pick: <T>(items: readonly T[]) => T
  chance: (probability: number) => boolean
  /** Normal taqsimot (Box–Muller) */
  normal: (mean: number, deviation: number) => number
  shuffle: <T>(items: readonly T[]) => T[]
}

/** Urug'li (deterministik) tasodifiy sonlar generatori — mulberry32 */
export function createRandom(seed: number): Random {
  let state = seed >>> 0

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (probability) => next() < probability,
    normal: (mean, deviation) => {
      const u = 1 - next()
      const v = next()
      return mean + deviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
    shuffle,
  }
}

/** Urug'siz (haqiqiy) tasodifiy generator — sinf vositalari uchun */
export const liveRandom: Random = createRandom(Math.floor(Math.random() * 2 ** 31))
