import { Suspense, useEffect } from 'react'
import { ErrorBoundary } from './app/ErrorBoundary'
import { GlobalHotkeys } from './app/GlobalHotkeys'
import { PageSkeleton } from './app/PageSkeleton'
import { pages } from './app/pages'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AlertsWatcher } from './components/overlays/AlertsWatcher'
import { CommandPalette } from './components/overlays/CommandPalette'
import { ConfirmHost } from './components/overlays/ConfirmHost'
import { OverlayHost } from './components/overlays/OverlayHost'
import { Toaster } from './components/overlays/Toaster'
import { FloatingTimer, TimerWatcher } from './components/tools/TimerWidget'
import { ThemeProvider } from './context/ThemeContext'
import { navItemOf } from './data/navigation'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { useRoute } from './router'
import { useApp } from './store/appStore'
import { closeDrawer, closeModal } from './store/uiStore'

function ActivePage() {
  const { page } = useRoute()

  // Brauzer sarlavhasi joriy bo'limni ko'rsatadi
  useEffect(() => {
    const label = page === 'not-found' ? 'Sahifa topilmadi' : navItemOf(page).label
    document.title = `${label} · EduQosun`
  }, [page])

  // Sahifa almashganda ochiq oynalar yopiladi
  useEffect(() => {
    closeDrawer()
    closeModal()
  }, [page])

  if (page === 'not-found') return <NotFoundPage />
  const Page = pages[page]
  return (
    // `key` — sahifa almashganda xatolik holati ham yangilanadi
    <ErrorBoundary key={page}>
      <Suspense fallback={<PageSkeleton />}>
        <Page />
      </Suspense>
    </ErrorBoundary>
  )
}

function Shell() {
  const { page } = useRoute()
  const loggedIn = useApp((s) => s.session.loggedIn)
  const reduceMotion = useApp((s) => s.settings.reduceMotion)

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [reduceMotion])

  if (!loggedIn) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <DashboardLayout currentPage={page}>
        <ActivePage />
      </DashboardLayout>
      <OverlayHost />
      <CommandPalette />
      <ConfirmHost />
      <Toaster />
      <FloatingTimer />
      <TimerWatcher />
      <AlertsWatcher />
      <GlobalHotkeys />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  )
}
