import type { Request, Response } from 'express'
import type { ServerEvents } from './types.js'

/* Server-Sent Events: panel bitta ochiq ulanish orqali yangi xabar va holatlarni oladi */

const clients = new Set<Response>()

const PING_MS = 25_000

export function eventsHandler(req: Request, res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.write('retry: 3000\n\n')
  clients.add(res)

  const ping = setInterval(() => res.write(': ping\n\n'), PING_MS)
  req.on('close', () => {
    clearInterval(ping)
    clients.delete(res)
  })
}

export function broadcast<K extends keyof ServerEvents>(type: K, data: ServerEvents[K]): void {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of clients) res.write(payload)
}
