import { useTheme } from '../context/ThemeContext'
import { primaryNav } from '../data/navigation'
import { useHotkeys } from '../hooks/useHotkeys'
import { navigateTo } from '../router'
import { openModal, openPalette, uiStore } from '../store/uiStore'

/** Hech qanday oyna ochiq emasmi (bir harfli yorliqlar faqat shunda ishlaydi) */
function idle(): boolean {
  const { modal, drawer, paletteOpen, confirm } = uiStore.getState()
  return !modal && !drawer && !paletteOpen && !confirm
}

export function GlobalHotkeys() {
  const { toggleTheme } = useTheme()

  useHotkeys([
    {
      key: 'k',
      ctrlOrMeta: true,
      allowInInput: true,
      handler: (event) => {
        event.preventDefault()
        openPalette()
      },
    },
    {
      key: '/',
      handler: (event) => {
        if (!idle()) return
        event.preventDefault()
        openPalette()
      },
    },
    { key: '?', handler: () => idle() && openModal({ type: 'shortcuts' }) },
    { key: 'r', alt: false, handler: () => idle() && openModal({ type: 'random-picker' }) },
    { key: 't', alt: false, handler: () => idle() && openModal({ type: 'timer' }) },
    { key: 'n', alt: false, handler: () => idle() && openModal({ type: 'reminder-form' }) },
    { key: 'd', alt: false, handler: () => idle() && toggleTheme() },
    ...primaryNav.slice(0, 9).map((item, index) => ({
      key: String(index + 1),
      alt: true,
      handler: (event: KeyboardEvent) => {
        event.preventDefault()
        navigateTo(item.id)
      },
    })),
  ])

  return null
}
