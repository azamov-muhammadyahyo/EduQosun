import { Atom, CodeXml, Cpu, Database, Globe } from 'lucide-react'
import type { AccentColor, GroupIconKey } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'

interface GlyphProps {
  className?: string
}

/* Brend belgilariga o'xshash sodda SVG glifalar (lucide'da yo'qlari uchun) */

function JsGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <text x="20" y="19" textAnchor="end" fontSize="9.5" fontWeight="800" fill="currentColor" fontFamily="Inter, system-ui, sans-serif">
        JS
      </text>
    </svg>
  )
}

function PythonGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c-4 0-4 1.6-4 3v2.5h4.2V9H6c-2 0-3 1.5-3 3.8S4 16.5 6 16.5h1.5V14c0-1.6 1.2-2.6 2.7-2.6h3.9c1.3 0 2.4-1 2.4-2.3V6c0-1.8-1.6-3-4.5-3Z" />
      <path d="M12 21c4 0 4-1.6 4-3v-2.5h-4.2V15H18c2 0 3-1.5 3-3.8S20 7.5 18 7.5h-1.5V10c0 1.6-1.2 2.6-2.7 2.6H9.9c-1.3 0-2.4 1-2.4 2.3V18c0 1.8 1.6 3 4.5 3Z" />
      <circle cx="10" cy="5.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="18.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function HtmlGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 3h16l-1.5 16.5L12 21.5l-6.5-2L4 3Z" />
      <path d="M15.5 7.5h-7l.35 4h6.3l-.45 4.2L12 16.5l-2.7-.8-.15-1.7" strokeLinecap="round" />
    </svg>
  )
}

function NodeGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5 20.5 7.3v9.4L12 21.5l-8.5-4.8V7.3L12 2.5Z" />
      <text x="12" y="15.2" textAnchor="middle" fontSize="7" fontWeight="800" fill="currentColor" stroke="none" fontFamily="Inter, system-ui, sans-serif">
        JS
      </text>
    </svg>
  )
}

function FigmaGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 3h3v6H9a3 3 0 0 1 0-6Z" />
      <path d="M12 3h3a3 3 0 0 1 0 6h-3V3Z" />
      <path d="M9 9h3v6H9a3 3 0 0 1 0-6Z" />
      <circle cx="15" cy="12" r="3" />
      <path d="M9 15h3v3a3 3 0 1 1-3-3Z" />
    </svg>
  )
}

export function GroupGlyph({ icon, className }: { icon: GroupIconKey; className?: string }) {
  switch (icon) {
    case 'code':
      return <CodeXml className={className} aria-hidden="true" />
    case 'globe':
      return <Globe className={className} aria-hidden="true" />
    case 'react':
      return <Atom className={className} aria-hidden="true" />
    case 'cpu':
      return <Cpu className={className} aria-hidden="true" />
    case 'database':
      return <Database className={className} aria-hidden="true" />
    case 'js':
      return <JsGlyph className={className} />
    case 'python':
      return <PythonGlyph className={className} />
    case 'html':
      return <HtmlGlyph className={className} />
    case 'node':
      return <NodeGlyph className={className} />
    case 'figma':
      return <FigmaGlyph className={className} />
  }
}

type TileSize = 'sm' | 'md' | 'lg' | 'xl'

const tileSizes: Record<TileSize, { box: string; icon: string }> = {
  sm: { box: 'h-9 w-9 rounded-lg', icon: 'h-[18px] w-[18px]' },
  md: { box: 'h-11 w-11 rounded-xl', icon: 'h-6 w-6' },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 'h-7 w-7' },
  xl: { box: 'h-16 w-16 rounded-2xl', icon: 'h-8 w-8' },
}

interface GroupTileProps {
  icon: GroupIconKey
  color: AccentColor
  size?: TileSize
  muted?: boolean
  className?: string
}

/** Guruhning rangli ikonka plitkasi */
export function GroupTile({ icon, color, size = 'md', muted = false, className }: GroupTileProps) {
  const s = tileSizes[size]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-white shadow-sm',
        s.box,
        muted ? 'bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700' : cn(accent[color].gradient, accent[color].shadow),
        className,
      )}
    >
      <GroupGlyph icon={icon} className={s.icon} />
    </span>
  )
}

/** Guruh qisqa nomi yozilgan rangli kvadrat ("11-A") */
export function GroupCodeTile({ name, color, size = 'md', className }: { name: string; color: AccentColor; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-bold text-white shadow-sm',
        size === 'sm' ? 'h-8 w-8 rounded-lg text-[11px]' : 'h-12 w-12 rounded-xl text-sm',
        accent[color].gradient,
        accent[color].shadow,
        className,
      )}
    >
      {name}
    </span>
  )
}
