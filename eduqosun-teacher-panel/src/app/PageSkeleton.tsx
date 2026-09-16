import { Skeleton } from '../components/ui/Misc'

/** Sahifa bo'lagi yuklanayotganda ko'rinadigan skelet */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 xl:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}
