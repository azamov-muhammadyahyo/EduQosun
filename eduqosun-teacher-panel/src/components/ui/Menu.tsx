import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { EllipsisVertical, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useOnClickOutside } from '../../hooks/useDom'
import { useFloating, type FloatingPlacement } from '../../hooks/useFloating'

export interface MenuItem {
  id: string
  label: string
  icon?: LucideIcon
  onSelect: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
  /** Shu elementdan oldin ajratuvchi chiziq */
  divider?: boolean
  hint?: string
}

interface MenuProps {
  items: MenuItem[]
  /** Tugma nomi (ekran o'quvchilari uchun) */
  label: string
  placement?: FloatingPlacement
  /** Maxsus trigger; berilmasa "⋮" tugmasi chiziladi */
  trigger?: (props: { open: boolean; toggle: () => void; ref: (el: HTMLButtonElement | null) => void; id: string }) => ReactNode
  triggerClassName?: string
  size?: 'sm' | 'md'
}

/** Ochiluvchi amallar menyusi: klaviatura (↑ ↓ Enter Esc) bilan ishlaydi */
export function Menu({ items, label, placement = 'bottom-end', trigger, triggerClassName, size = 'sm' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const id = useId()

  useFloating(anchorRef, menuRef, open, placement)
  useOnClickOutside([anchorRef, menuRef], () => setOpen(false), open)

  const close = useCallback((focusTrigger = true) => {
    setOpen(false)
    setActive(-1)
    if (focusTrigger) anchorRef.current?.focus()
  }, [])

  useEffect(() => {
    if (open) menuRef.current?.focus()
  }, [open])

  const enabledIndexes = items.map((item, index) => (item.disabled ? -1 : index)).filter((i) => i >= 0)

  const move = (step: 1 | -1) => {
    if (enabledIndexes.length === 0) return
    const position = enabledIndexes.indexOf(active)
    const next = position === -1 ? (step === 1 ? 0 : enabledIndexes.length - 1) : (position + step + enabledIndexes.length) % enabledIndexes.length
    setActive(enabledIndexes[next])
  }

  const select = (item: MenuItem) => {
    if (item.disabled) return
    close(false)
    item.onSelect()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const item = items[active]
      if (item) select(item)
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      close()
    }
  }

  const toggle = () => setOpen((value) => !value)
  const setAnchor = (el: HTMLButtonElement | null) => {
    anchorRef.current = el
  }

  return (
    <>
      {trigger ? (
        trigger({ open, toggle, ref: setAnchor, id })
      ) : (
        <button
          ref={setAnchor}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            toggle()
          }}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700 dark:hover:text-white',
            size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
            open && 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white',
            triggerClassName,
          )}
        >
          <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={id}
              role="menu"
              aria-label={label}
              tabIndex={-1}
              onKeyDown={onKeyDown}
              onClick={(event) => event.stopPropagation()}
              className="fixed z-[80] min-w-[200px] animate-menu-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              {items.map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={item.id}>
                    {item.divider ? <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" /> : null}
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      tabIndex={-1}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => select(item)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                        item.tone === 'danger'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-700 dark:text-slate-200',
                        active === index &&
                          (item.tone === 'danger' ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-slate-100 dark:bg-slate-700/70'),
                      )}
                    >
                      {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" /> : null}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint ? <span className="text-xs text-slate-400">{item.hint}</span> : null}
                    </button>
                  </div>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
