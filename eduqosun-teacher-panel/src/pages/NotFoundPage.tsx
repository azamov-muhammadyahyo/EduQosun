import { House, SearchX } from 'lucide-react'
import { navigateTo } from '../router'
import { openPalette } from '../store/uiStore'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="animate-fade-in flex min-h-[65vh] flex-col items-center justify-center text-center">
      <span className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        <SearchX className="h-10 w-10" aria-hidden="true" />
      </span>
      <p className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Sahifa topilmadi</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Siz izlagan sahifa mavjud emas yoki boshqa manzilga ko'chirilgan.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="secondary" onClick={openPalette}>
          Qidiruvni ochish
        </Button>
        <Button icon={House} onClick={() => navigateTo('home')}>
          Bosh sahifaga qaytish
        </Button>
      </div>
    </div>
  )
}
