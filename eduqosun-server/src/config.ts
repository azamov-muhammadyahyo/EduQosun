import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Server papkasi (src/ yoki dist/ ning ota papkasi) */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const envFile = path.join(root, '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile)

function readInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) ? value : fallback
}

function readList(name: string, fallback: string): string[] {
  return (process.env[name]?.trim() || fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const dataDir = path.resolve(root, process.env.DATA_DIR?.trim() || 'data')

export const config = {
  root,
  host: process.env.HOST?.trim() || '127.0.0.1',
  port: readInt('PORT', 4000),
  apiId: readInt('TG_API_ID', 0),
  apiHash: process.env.TG_API_HASH?.trim() ?? '',
  sessionSecret: process.env.SESSION_SECRET?.trim() ?? '',
  maxUploadBytes: readInt('MAX_UPLOAD_MB', 2000) * 1024 * 1024,
  allowedOrigins: readList(
    'ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173',
  ),
  allowedHosts: readList('ALLOWED_HOSTS', 'localhost,127.0.0.1,[::1]'),
  dataDir,
  uploadDir: path.join(dataDir, 'uploads'),
  mediaDir: path.join(dataDir, 'media'),
}

for (const dir of [config.dataDir, config.uploadDir, config.mediaDir]) mkdirSync(dir, { recursive: true })

/** my.telegram.org kalitlari kiritilganmi */
export const telegramConfigured = config.apiId > 0 && config.apiHash.length > 0
