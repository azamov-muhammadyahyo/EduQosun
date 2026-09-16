let counter = 0

/** Qisqa, takrorlanmas identifikator: "grp_lx2k9a_3f" */
export function createId(prefix: string): string {
  counter = (counter + 1) % 1296
  const time = Date.now().toString(36)
  const random = Math.floor(Math.random() * 1296).toString(36).padStart(2, '0')
  return `${prefix}_${time}${random}${counter.toString(36)}`
}
