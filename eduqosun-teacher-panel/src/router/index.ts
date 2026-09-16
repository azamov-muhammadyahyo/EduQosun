import { useMemo } from 'react'
import type { PageId } from '../types'
import { pageIds } from '../data/navigation'
import { createStore, useStore } from '../store/createStore'

/*
 * Yengil hash-router: #lessons, #groups/g1, #attendance?group=g1&date=2025-05-12
 * Server sozlamasiz ishlaydi va brauzerning "orqaga/oldinga" tugmalarini qo'llab-quvvatlaydi.
 */

export interface Route {
  page: PageId | 'not-found'
  /** Yo'lning ikkinchi bo'lagi (masalan, guruh yoki suhbat ID) */
  param: string | null
  query: URLSearchParams
}

const readHash = () => (typeof window === 'undefined' ? '' : window.location.hash)

const hashStore = createStore<string>(readHash())

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => hashStore.setState(readHash()))
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [path, search = ''] = raw.split('?')
  const [first = '', second] = path.split('/')
  const pageName = first || 'home'
  const page = (pageIds as string[]).includes(pageName) ? (pageName as PageId) : 'not-found'
  return {
    page,
    param: second ? decodeURIComponent(second) : null,
    query: new URLSearchParams(search),
  }
}

export function useRoute(): Route {
  const hash = useStore(hashStore, (value) => value)
  return useMemo(() => parseHash(hash), [hash])
}

type QueryValue = string | number | null | undefined

/** Yo'l yasaydi: buildPath('attendance', null, { group: 'g1' }) → "attendance?group=g1" */
export function buildPath(page: PageId, param?: string | null, query?: Record<string, QueryValue>): string {
  let path: string = page
  if (param) path += `/${encodeURIComponent(param)}`
  if (query) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') search.set(key, String(value))
    }
    const text = search.toString()
    if (text) path += `?${text}`
  }
  return path
}

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const target = `#${path.replace(/^#/, '')}`
  if (target === window.location.hash) return
  if (options.replace) {
    window.history.replaceState(window.history.state, '', target)
    hashStore.setState(target)
    return
  }
  const previousPage = parseHash(window.location.hash).page
  window.location.hash = target
  if (parseHash(target).page !== previousPage) {
    window.scrollTo({ top: 0 })
  }
}

export function navigateTo(page: PageId, param?: string | null, query?: Record<string, QueryValue>): void {
  navigate(buildPath(page, param, query))
}

/**
 * Joriy sahifaning so'rov parametrlarini yangilaydi (tarixga yangi yozuv qo'shmaydi).
 * `null` yoki bo'sh qiymat — parametrni olib tashlaydi.
 */
export function updateQuery(patch: Record<string, QueryValue>): void {
  const route = parseHash(window.location.hash)
  if (route.page === 'not-found') return
  const query: Record<string, QueryValue> = Object.fromEntries(route.query.entries())
  navigate(buildPath(route.page, route.param, { ...query, ...patch }), { replace: true })
}
