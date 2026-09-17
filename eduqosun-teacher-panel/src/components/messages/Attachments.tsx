import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Download, FileText, ImageOff, Loader2, Music, Pause, Play, X } from 'lucide-react'
import type { ChatAttachment } from '../../types'
import { mediaDownloadUrl } from '../../api/telegram'
import { cn } from '../../lib/cn'
import { formatBytes } from '../../lib/format'
import { formatDuration } from '../../lib/media'
import { useFocusTrap, useLockBodyScroll } from '../../hooks/useDom'
import { displayUrl } from '../../store/actions/telegram'

/* ———————————— Yuklab olish havolasi ———————————— */

function downloadHref(attachment: ChatAttachment): string {
  const url = displayUrl(attachment.url) ?? attachment.url
  return url.startsWith('blob:') ? url : mediaDownloadUrl(attachment.url)
}

/* ———————————— Rasm va video to'ri ———————————— */

const isVisual = (a: ChatAttachment) => a.kind === 'photo' || a.kind === 'video'

function Thumbnail({ attachment, className, style }: { attachment: ChatAttachment; className?: string; style?: CSSProperties }) {
  const [failed, setFailed] = useState(false)
  const src = displayUrl(attachment.thumbUrl ?? (attachment.kind === 'photo' ? attachment.url : undefined))
  const localVideo = attachment.kind === 'video' && !src && attachment.url.startsWith('blob:')

  if (localVideo) {
    return <video src={attachment.url} muted playsInline preload="metadata" className={cn('h-full w-full object-cover', className)} style={style} />
  }
  if (!src || failed) {
    return (
      <span className={cn('flex h-full w-full items-center justify-center bg-slate-200 text-slate-400 dark:bg-slate-700', className)} style={style}>
        {attachment.kind === 'video' ? <Play className="h-8 w-8" aria-hidden="true" /> : <ImageOff className="h-6 w-6" aria-hidden="true" />}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={attachment.name ?? (attachment.kind === 'photo' ? 'Rasm' : 'Video')}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className)}
      style={style}
    />
  )
}

function MediaTile({ attachment, onOpen, className, style }: { attachment: ChatAttachment; onOpen: () => void; className?: string; style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn('group/tile relative block overflow-hidden rounded-xl bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-slate-700', className)}
      style={style}
      aria-label={attachment.kind === 'video' ? "Videoni ko'rish" : "Rasmni ko'rish"}
    >
      <Thumbnail attachment={attachment} className="transition-transform duration-300 group-hover/tile:scale-[1.03]" />
      {attachment.kind === 'video' ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/55 text-white backdrop-blur-sm">
              <Play className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden="true" />
            </span>
          </span>
          {attachment.duration ? (
            <span className="absolute left-2 top-2 rounded-md bg-slate-900/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
              {formatDuration(attachment.duration)}
            </span>
          ) : null}
        </>
      ) : null}
    </button>
  )
}

function MediaGrid({ items, onOpen }: { items: ChatAttachment[]; onOpen: (index: number) => void }) {
  if (items.length === 1) {
    const [item] = items
    const ratio = item.width && item.height ? item.width / item.height : 4 / 3
    return (
      <MediaTile
        attachment={item}
        onOpen={() => onOpen(0)}
        className="w-[min(320px,100%)]"
        style={{ aspectRatio: String(Math.min(Math.max(ratio, 0.6), 1.9)) }}
      />
    )
  }
  return (
    <div className="grid w-[min(320px,100%)] grid-cols-2 gap-1">
      {items.map((item, index) => (
        <MediaTile
          key={item.tgId ?? item.url}
          attachment={item}
          onOpen={() => onOpen(index)}
          className={cn(items.length % 2 === 1 && index === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square')}
        />
      ))}
    </div>
  )
}

/* ———————————— Ovozli xabar ———————————— */

const VOICE_BARS = 40

function resample(values: number[] | undefined): number[] {
  if (!values?.length) return Array.from({ length: VOICE_BARS }, () => 6)
  return Array.from({ length: VOICE_BARS }, (_, i) => {
    const from = Math.floor((i * values.length) / VOICE_BARS)
    const to = Math.max(from + 1, Math.floor(((i + 1) * values.length) / VOICE_BARS))
    return Math.max(...values.slice(from, to))
  })
}

export function Waveform({ values, progress, mine, onSeek }: { values: number[]; progress: number; mine: boolean; onSeek?: (fraction: number) => void }) {
  return (
    <div
      className={cn('flex h-7 min-w-0 flex-1 items-center gap-[2px]', onSeek && 'cursor-pointer')}
      onClick={(event) => {
        if (!onSeek) return
        const rect = event.currentTarget.getBoundingClientRect()
        onSeek(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)))
      }}
      aria-hidden="true"
    >
      {values.map((value, index) => {
        const played = index / values.length < progress
        return (
          <span
            key={index}
            className={cn(
              'w-[3px] shrink-0 rounded-full transition-colors',
              mine ? (played ? 'bg-white' : 'bg-white/45') : played ? 'bg-blue-500 dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600',
            )}
            style={{ height: `${Math.max(12, (value / 31) * 100)}%` }}
          />
        )
      })}
    </div>
  )
}

export function VoicePlayer({ attachment, mine }: { attachment: ChatAttachment; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const [failed, setFailed] = useState(false)
  const duration = attachment.duration ?? 0
  const bars = resample(attachment.waveform)

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      setLoading(audio.readyState < 3)
      void audio.play().catch(() => {
        setLoading(false)
        setFailed(true)
      })
    } else {
      audio.pause()
    }
  }

  const seek = (fraction: number) => {
    const audio = audioRef.current
    const total = Number.isFinite(audio?.duration) ? audio!.duration : duration
    if (audio && total > 0) audio.currentTime = fraction * total
  }

  return (
    <div className="flex w-[min(260px,100%)] items-center gap-2.5 py-0.5">
      <audio
        ref={audioRef}
        src={displayUrl(attachment.url)}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setCurrent(0)
        }}
        onCanPlay={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onError={() => {
          setLoading(false)
          setFailed(true)
        }}
      />
      <button
        type="button"
        onClick={toggle}
        disabled={failed}
        aria-label={playing ? "To'xtatish" : 'Tinglash'}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50',
          mine ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700',
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : playing ? (
          <Pause className="h-4 w-4" fill="currentColor" aria-hidden="true" />
        ) : (
          <Play className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <Waveform values={bars} progress={duration > 0 ? current / duration : 0} mine={mine} onSeek={seek} />
        <p className={cn('mt-0.5 text-[11px] tabular-nums', mine ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400')}>
          {failed ? "Ovozni ochib bo'lmadi" : formatDuration(playing || current > 0 ? current : duration)}
        </p>
      </div>
    </div>
  )
}

/* ———————————— Audio va fayllar ———————————— */

function FileCard({ attachment, mine }: { attachment: ChatAttachment; mine: boolean }) {
  const Icon = attachment.kind === 'audio' ? Music : FileText
  return (
    <div className="w-[min(280px,100%)]">
      <div className="flex items-center gap-3 py-0.5">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', mine ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400')}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium" title={attachment.name}>
            {attachment.name ?? 'Fayl'}
          </span>
          <span className={cn('block text-[11px]', mine ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400')}>
            {[attachment.size ? formatBytes(attachment.size) : null, attachment.duration ? formatDuration(attachment.duration) : null].filter(Boolean).join(' · ') || 'Fayl'}
          </span>
        </span>
        <a
          href={downloadHref(attachment)}
          download={attachment.name ?? true}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
            mine ? 'text-white hover:bg-white/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white',
          )}
          aria-label="Yuklab olish"
          title="Yuklab olish"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
      {attachment.kind === 'audio' ? <audio src={displayUrl(attachment.url)} controls preload="none" className="mt-1.5 h-8 w-full" /> : null}
    </div>
  )
}

/* ———————————— To'liq ekranli ko'ruvchi ———————————— */

function MediaViewer({ items, index, onIndex, onClose }: { items: ChatAttachment[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const item = items[index]
  useLockBodyScroll(true)
  useFocusTrap(panelRef, true)

  useEffect(() => setLoading(true), [index])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
      if (event.key === 'ArrowRight' && index < items.length - 1) onIndex(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, items.length, onClose, onIndex])

  if (!item) return null
  const src = displayUrl(item.url)
  const remote = !src?.startsWith('blob:')

  return createPortal(
    <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Media ko'rish" tabIndex={-1} className="fixed inset-0 z-[80] flex animate-overlay-in flex-col bg-slate-950/95 outline-none">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="min-w-0 truncate text-sm text-white/80">
          {items.length > 1 ? `${index + 1} / ${items.length}` : ''} {item.name ?? ''}
        </p>
        <div className="flex items-center gap-1">
          <a href={downloadHref(item)} download={item.name ?? true} className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Yuklab olish" title="Yuklab olish">
            <Download className="h-5 w-5" aria-hidden="true" />
          </a>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Yopish">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onClick={(event) => event.target === event.currentTarget && onClose()}>
        {loading ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
            {remote && item.kind === 'video' ? <p className="text-xs">Video Telegramdan yuklanmoqda…</p> : null}
          </div>
        ) : null}
        {item.kind === 'video' ? (
          <video
            key={item.url}
            src={src}
            controls
            autoPlay
            playsInline
            onLoadedData={() => setLoading(false)}
            onError={() => setLoading(false)}
            className="max-h-full max-w-full rounded-lg"
          />
        ) : (
          <img
            key={item.url}
            src={src}
            alt={item.name ?? 'Rasm'}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}
        {index > 0 ? (
          <button type="button" onClick={() => onIndex(index - 1)} className="absolute left-3 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20" aria-label="Oldingi">
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}
        {index < items.length - 1 ? (
          <button type="button" onClick={() => onIndex(index + 1)} className="absolute right-3 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20" aria-label="Keyingi">
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

/* ———————————— Xabardagi barcha fayllar ———————————— */

export function MessageAttachments({ attachments, mine }: { attachments: ChatAttachment[]; mine: boolean }) {
  const [viewing, setViewing] = useState<number | null>(null)
  const visual = attachments.filter(isVisual)
  const others = attachments.filter((a) => !isVisual(a))

  return (
    <div className="space-y-1.5">
      {visual.length > 0 ? <MediaGrid items={visual} onOpen={setViewing} /> : null}
      {others.map((attachment) =>
        attachment.kind === 'voice' ? (
          <VoicePlayer key={attachment.tgId ?? attachment.url} attachment={attachment} mine={mine} />
        ) : (
          <FileCard key={attachment.tgId ?? attachment.url} attachment={attachment} mine={mine} />
        ),
      )}
      {viewing !== null ? <MediaViewer items={visual} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} /> : null}
    </div>
  )
}
