import { useEffect, useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Dashboard } from './pages/Dashboard'
import { Lessons } from './pages/Lessons'
import { Placeholder } from './pages/Placeholder'

/** URL hash'idan boshlang'ich sahifani o'qiydi (masalan, #lessons) */
function getPageFromHash(): string {
  if (typeof window === 'undefined') return 'home'
  return window.location.hash.replace('#', '') || 'home'
}

function renderPage(page: string) {
  switch (page) {
    case 'home':
      return <Dashboard />
    case 'lessons':
      return <Lessons />
    default:
      return <Placeholder pageId={page} />
  }
}

export default function App() {
  const [page, setPage] = useState<string>(getPageFromHash)

  // Brauzerning "orqaga/oldinga" tugmalari ishlashi uchun
  useEffect(() => {
    const handleHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleNavigate = (id: string) => {
    setPage(id)
    try {
      window.location.hash = id
    } catch {
      /* hash o'rnatib bo'lmasa ham sahifa almashadi */
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ThemeProvider>
      <DashboardLayout currentPage={page} onNavigate={handleNavigate}>
        {renderPage(page)}
      </DashboardLayout>
    </ThemeProvider>
  )
}
