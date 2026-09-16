import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { Button } from '../components/ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Sahifadagi kutilmagan xatolik butun ilovani to'xtatib qo'ymasligi uchun */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('EduQosun: sahifada xatolik', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    // Yangi versiya chiqqanda eski bo'lak yuklanmay qolishi mumkin — sahifani yangilash yordam beradi
    const chunkError = /Failed to fetch dynamically imported module|Importing a module script failed/i.test(error.message)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <TriangleAlert className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Nimadir noto'g'ri ketdi</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {chunkError
            ? "Ilovaning yangi versiyasi mavjud. Davom etish uchun sahifani yangilang."
            : "Sahifani ko'rsatishda xatolik yuz berdi. Ma'lumotlaringiz saqlangan — sahifani qayta yuklab ko'ring."}
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" onClick={() => this.setState({ error: null })}>
            Qayta urinish
          </Button>
          <Button icon={RotateCcw} onClick={() => window.location.reload()}>
            Sahifani yangilash
          </Button>
        </div>
      </div>
    )
  }
}
