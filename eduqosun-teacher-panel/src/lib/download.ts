/** Brauzerda fayl yuklab olishni boshlaydi */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Yuklab olish boshlanishiga ulgurishi uchun biroz kutib, xotirani bo'shatamiz
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export type CsvCell = string | number | null | undefined

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * CSV yuklab olish. Ajratuvchi — nuqtali vergul: O'zbekiston/MDH hududiy sozlamalaridagi Excel
 * shu belgini kutadi. BOM (\uFEFF) kirill/lotin harflari to'g'ri ochilishini ta'minlaydi.
 */
export function downloadCsv(filename: string, rows: CsvCell[][]): void {
  const body = rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')
  downloadFile(filename.endsWith('.csv') ? filename : `${filename}.csv`, `\uFEFF${body}`, 'text/csv;charset=utf-8')
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error("Faylni o'qib bo'lmadi"))
    reader.readAsText(file)
  })
}
