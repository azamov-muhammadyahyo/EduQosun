import { useCallback, useEffect, useRef, useState } from 'react'
import type { RecordedVoice } from '../store/actions/telegram'

/*
 * Mikrofondan ovozli xabar yozish (MediaRecorder).
 * Yozish davomida ovoz balandligi o'lchanadi — undan Telegram to'lqini (waveform) yasaladi.
 */

export type RecorderState = 'idle' | 'starting' | 'recording'

const SAMPLE_MS = 80
const LIVE_BARS = 40
const WAVEFORM_BARS = 100
/** Telegram ovozli xabari uchun amaliy chegara */
export const MAX_VOICE_SECONDS = 30 * 60

const PREFERRED_TYPES = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

function toWaveform(samples: number[]): number[] {
  if (samples.length === 0) return []
  const bins: number[] = []
  for (let i = 0; i < WAVEFORM_BARS; i += 1) {
    const from = Math.floor((i * samples.length) / WAVEFORM_BARS)
    const to = Math.max(from + 1, Math.floor(((i + 1) * samples.length) / WAVEFORM_BARS))
    bins.push(Math.max(...samples.slice(from, to)))
  }
  const peak = Math.max(...bins) || 1
  return bins.map((value) => Math.round((value / peak) * 31))
}

function microphoneError(error: unknown): Error {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return new Error("Mikrofonga ruxsat berilmagan. Manzil satridagi qulf belgisi orqali ruxsat bering.")
  }
  if (name === 'NotFoundError') return new Error('Mikrofon topilmadi.')
  if (name === 'NotReadableError') return new Error('Mikrofon boshqa dastur tomonidan band.')
  return new Error("Mikrofonni yoqib bo'lmadi.")
}

interface Session {
  recorder: MediaRecorder
  stream: MediaStream
  context: AudioContext
  chunks: Blob[]
  samples: number[]
  startedAt: number
  timer: number
}

export function useVoiceRecorder(options: { onLimit?: () => void } = {}) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [levels, setLevels] = useState<number[]>([])
  const session = useRef<Session | null>(null)
  const onLimit = useRef(options.onLimit)
  onLimit.current = options.onLimit

  const release = useCallback(() => {
    const current = session.current
    session.current = null
    if (current) {
      window.clearInterval(current.timer)
      current.stream.getTracks().forEach((track) => track.stop())
      void current.context.close().catch(() => undefined)
    }
    setState('idle')
    setElapsed(0)
    setLevels([])
  }, [])

  const start = useCallback(async () => {
    if (session.current) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error("Brauzeringiz ovoz yozishni qo'llab-quvvatlamaydi.")
    }
    setState('starting')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch (error) {
      setState('idle')
      throw microphoneError(error)
    }

    const mimeType = PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined)
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 1024
    context.createMediaStreamSource(stream).connect(analyser)
    const buffer = new Uint8Array(analyser.fftSize)

    const current: Session = { recorder, stream, context, chunks: [], samples: [], startedAt: performance.now(), timer: 0 }
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) current.chunks.push(event.data)
    }
    current.timer = window.setInterval(() => {
      analyser.getByteTimeDomainData(buffer)
      let peak = 0
      for (const value of buffer) peak = Math.max(peak, Math.abs(value - 128) / 128)
      current.samples.push(peak)
      setLevels((previous) => [...previous.slice(-(LIVE_BARS - 1)), peak])
      const seconds = (performance.now() - current.startedAt) / 1000
      setElapsed(seconds)
      if (seconds >= MAX_VOICE_SECONDS) onLimit.current?.()
    }, SAMPLE_MS)

    session.current = current
    recorder.start(250)
    setState('recording')
  }, [])

  /** Yozishni tugatadi va natijani qaytaradi */
  const stop = useCallback((): Promise<RecordedVoice | null> => {
    const current = session.current
    if (!current) return Promise.resolve(null)
    const duration = (performance.now() - current.startedAt) / 1000
    return new Promise((resolve) => {
      current.recorder.onstop = () => {
        const blob = new Blob(current.chunks, { type: current.recorder.mimeType || 'audio/webm' })
        const waveform = toWaveform(current.samples)
        release()
        resolve({ blob, duration, waveform })
      }
      current.recorder.stop()
    })
  }, [release])

  const cancel = useCallback(() => {
    const current = session.current
    if (!current) return
    current.recorder.onstop = null
    if (current.recorder.state !== 'inactive') current.recorder.stop()
    release()
  }, [release])

  // Komponent yopilsa mikrofon o'chiriladi
  useEffect(() => cancel, [cancel])

  return { state, elapsed, levels, start, stop, cancel }
}
