/*
 * eduqosun-server bilan aloqa. Vite /api so'rovlarini serverga uzatadi (vite.config.ts).
 * Har bir o'zgartiruvchi so'rovda X-EduQosun sarlavhasi bo'ladi — server boshqa saytlardan
 * kelgan so'rovlarni shu orqali rad etadi.
 */

export const API_BASE = '/api'

const CLIENT_HEADER = { 'X-EduQosun': '1' }

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message)
  }

  /** Server ishlamayapti yoki tarmoq yo'q */
  get offline(): boolean {
    return this.code === 'OFFLINE'
  }
}

const OFFLINE_MESSAGE = "Server bilan aloqa yo'q. eduqosun-server ishga tushirilganini tekshiring (npm run server)."

async function errorFrom(response: Response): Promise<ApiError> {
  // Vite proxy server o'chiq bo'lsa 502/504 qaytaradi
  if (response.status === 502 || response.status === 503 || response.status === 504) {
    const body = await response.json().catch(() => null)
    if (!body?.error) return new ApiError(OFFLINE_MESSAGE, response.status, 'OFFLINE')
    return new ApiError(body.error.message, response.status, body.error.code ?? 'ERROR')
  }
  const body = (await response.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null
  return new ApiError(body?.error?.message ?? `Server xatosi (${response.status})`, response.status, body?.error?.code ?? 'ERROR')
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  json?: unknown
  signal?: AbortSignal
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = options.json === undefined ? 'GET' : 'POST', json, signal } = options
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      signal,
      headers: json === undefined ? CLIENT_HEADER : { ...CLIENT_HEADER, 'Content-Type': 'application/json' },
      body: json === undefined ? undefined : JSON.stringify(json),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(OFFLINE_MESSAGE, 0, 'OFFLINE')
  }
  if (!response.ok) throw await errorFrom(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Fayl yuklash (yuklanish foizini kuzatish uchun XMLHttpRequest) */
export function uploadForm<T>(path: string, form: FormData, onProgress?: (fraction: number) => void): { promise: Promise<T>; abort: () => void } {
  const xhr = new XMLHttpRequest()
  const promise = new Promise<T>((resolve, reject) => {
    xhr.open('POST', `${API_BASE}${path}`)
    xhr.setRequestHeader('X-EduQosun', '1')
    xhr.responseType = 'json'
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total)
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as T)
        return
      }
      const body = xhr.response as { error?: { message?: string; code?: string } } | null
      if (!body?.error && xhr.status >= 502) reject(new ApiError(OFFLINE_MESSAGE, xhr.status, 'OFFLINE'))
      else reject(new ApiError(body?.error?.message ?? `Server xatosi (${xhr.status})`, xhr.status, body?.error?.code ?? 'ERROR'))
    }
    xhr.onerror = () => reject(new ApiError(OFFLINE_MESSAGE, 0, 'OFFLINE'))
    xhr.onabort = () => reject(new ApiError('Yuborish bekor qilindi.', 0, 'ABORTED'))
    xhr.send(form)
  })
  return { promise, abort: () => xhr.abort() }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Noma’lum xatolik'
}
