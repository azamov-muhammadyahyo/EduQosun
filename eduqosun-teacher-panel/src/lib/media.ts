import type { AttachmentKind } from '../types'

/*
 * Brauzerda fayl haqida ma'lumot yig'ish: rasm o'lchami, video davomiyligi va kichik nusxasi.
 * Telegram videoni to'g'ri ko'rsatishi uchun bu ma'lumotlar yuborish bilan birga ketadi.
 */

export interface MediaInfo {
  width?: number
  height?: number
  duration?: number
  /** Video uchun JPEG kichik nusxa (≤ 320 px) */
  thumb?: Blob
}

const META_TIMEOUT_MS = 6000
const THUMB_SIZE = 320

export function attachmentKindOf(mime: string): AttachmentKind {
  if (mime.startsWith('image/') && mime !== 'image/svg+xml') return 'photo'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'file'
}

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), META_TIMEOUT_MS))])
}

function imageInfo(url: string): Promise<MediaInfo> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => resolve({})
    image.src = url
  })
}

function canvasToJpeg(source: CanvasImageSource, width: number, height: number): Promise<Blob | undefined> {
  const scale = Math.min(1, THUMB_SIZE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(undefined)
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? undefined), 'image/jpeg', 0.72))
}

function videoInfo(url: string): Promise<MediaInfo> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    let info: MediaInfo = {}
    const finish = () => {
      video.removeAttribute('src')
      video.load()
      resolve(info)
    }
    video.onloadedmetadata = () => {
      info = { width: video.videoWidth || undefined, height: video.videoHeight || undefined, duration: Number.isFinite(video.duration) ? video.duration : undefined }
      if (!video.videoWidth) return finish()
      // Birinchi kadr ko'pincha qora — biroz oldinga o'tamiz
      video.currentTime = Math.min(1, (video.duration || 0) / 3)
    }
    video.onseeked = () => {
      void canvasToJpeg(video, video.videoWidth, video.videoHeight).then((thumb) => {
        info = { ...info, thumb }
        finish()
      })
    }
    video.onerror = finish
    video.src = url
  })
}

function audioInfo(url: string): Promise<MediaInfo> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => resolve({ duration: Number.isFinite(audio.duration) ? audio.duration : undefined })
    audio.onerror = () => resolve({})
    audio.src = url
  })
}

/** `url` — shu faylning blob: manzili (qayta yaratilmasligi uchun tashqaridan beriladi) */
export function readMediaInfo(file: File, url: string): Promise<MediaInfo> {
  const kind = attachmentKindOf(file.type)
  const task = kind === 'photo' ? imageInfo(url) : kind === 'video' ? videoInfo(url) : kind === 'audio' ? audioInfo(url) : Promise.resolve({})
  return withTimeout(task, {})
}

/** 75 → "1:15" */
export function formatDuration(seconds: number | undefined): string {
  const total = Math.max(0, Math.round(seconds ?? 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = String(total % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`
}
