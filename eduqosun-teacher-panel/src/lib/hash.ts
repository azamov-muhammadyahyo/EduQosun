/** Parol xeshi (SHA-256, hex). SubtleCrypto bo'lmagan muhitda oddiy FNV-1a zaxira ishlatiladi. */
export async function hashPassword(value: string): Promise<string> {
  const data = new TextEncoder().encode(`eduqosun:${value}`)
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  }
  let hash = 0x811c9dc5
  for (const byte of data) {
    hash ^= byte
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `fnv-${hash.toString(16)}`
}

/** Parol ishonchliligi: 0 (juda zaif) … 4 (kuchli) */
export function passwordStrength(value: string): number {
  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 0.5
  if (/[^A-Za-z0-9]/.test(value)) score += 0.5
  return Math.min(4, Math.floor(score))
}
