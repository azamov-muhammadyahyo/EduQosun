import express, { type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { AppError, toAppError } from '../errors.js'
import { router } from './routes.js'

/**
 * Faqat panelning o'zidan kelgan so'rovlarni o'tkazadi:
 *  - Host — localhost (DNS rebinding'dan himoya)
 *  - Origin — ruxsat etilgan manzillardan biri
 *  - o'zgartiruvchi so'rovlarda maxsus sarlavha (boshqa sayt formasi orqali xabar yuborib bo'lmaydi)
 */
function guard(req: Request, res: Response, next: NextFunction): void {
  const host = (req.headers.host ?? '').replace(/:\d+$/, '').toLowerCase()
  if (!config.allowedHosts.includes(host)) {
    res.status(403).json({ error: { message: 'Ruxsat etilmagan host.', code: 'FORBIDDEN_HOST' } })
    return
  }
  const origin = req.headers.origin
  if (origin && !config.allowedOrigins.includes(origin)) {
    res.status(403).json({ error: { message: 'Ruxsat etilmagan manba.', code: 'FORBIDDEN_ORIGIN' } })
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.headers['x-eduqosun'] !== '1') {
    res.status(403).json({ error: { message: "So'rov paneldan kelmagan.", code: 'FORBIDDEN_CLIENT' } })
    return
  }
  next()
}

function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(error)
    return
  }
  let appError: AppError
  if (error instanceof multer.MulterError) {
    appError =
      error.code === 'LIMIT_FILE_SIZE'
        ? new AppError(413, `Fayl juda katta. Bitta fayl ${Math.round(config.maxUploadBytes / 1024 / 1024)} MB dan oshmasin.`, error.code)
        : error.code === 'LIMIT_FILE_COUNT'
          ? new AppError(413, "Bir xabarda fayllar soni juda ko'p.", error.code)
          : new AppError(400, `Faylni qabul qilib bo'lmadi (${error.code}).`, error.code)
  } else if (error instanceof SyntaxError && 'body' in error) {
    appError = new AppError(400, "So'rov formati noto'g'ri.", 'BAD_JSON')
  } else {
    appError = toAppError(error)
  }
  res.status(appError.status).json({ error: { message: appError.message, code: appError.code } })
}

export function createApp(): express.Express {
  const app = express()
  app.disable('x-powered-by')
  app.use('/api', guard, express.json({ limit: '1mb' }), router)
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { message: 'Manzil topilmadi.', code: 'NOT_FOUND' } })
  })
  app.use(errorHandler)
  return app
}
