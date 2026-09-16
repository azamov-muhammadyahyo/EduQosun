type ChimeKind = 'done' | 'notify'

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null
  audioContext ??= new window.AudioContext()
  return audioContext
}

/** Yoqimli qisqa signal (tashqi audio fayllarsiz, Web Audio API orqali) */
export function playChime(kind: ChimeKind = 'notify'): void {
  try {
    const ctx = getContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()

    const notes = kind === 'done' ? [659.25, 783.99, 1046.5] : [880, 1174.66]
    notes.forEach((frequency, index) => {
      const start = ctx.currentTime + index * 0.16
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45)
      oscillator.connect(gain).connect(ctx.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.5)
    })
  } catch {
    /* Ovoz chiqarib bo'lmasa — jim o'tkazamiz */
  }
}
