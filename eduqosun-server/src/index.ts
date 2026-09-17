import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { config, telegramConfigured } from './config.js'
import { createApp } from './http/app.js'
import { telegram } from './telegram/client.js'
import { attachUpdateHandlers } from './telegram/updates.js'

/** Oldingi ishga tushishdan qolib ketgan vaqtinchalik yuklamalar */
async function clearUploads(): Promise<void> {
  const files = await readdir(config.uploadDir).catch(() => [])
  await Promise.all(files.map((file) => rm(path.join(config.uploadDir, file), { force: true }).catch(() => undefined)))
}

async function main(): Promise<void> {
  await clearUploads()
  telegram.onConnected(attachUpdateHandlers)

  const app = createApp()
  const server = app.listen(config.port, config.host, () => {
    console.log(`EduQosun server ishga tushdi: http://${config.host}:${config.port}`)
    if (!telegramConfigured) {
      console.warn(
        '\n⚠  Telegram kalitlari kiritilmagan.\n' +
          '   1) https://my.telegram.org → API development tools → ilova yarating\n' +
          '   2) eduqosun-server/.env fayliga TG_API_ID va TG_API_HASH ni yozing (.env.example dan nusxa oling)\n' +
          '   3) Serverni qayta ishga tushiring\n',
      )
    }
  })
  // Katta fayllar uzoq yuklanadi — so'rov vaqti cheklanmaydi
  server.requestTimeout = 0

  await telegram.init()

  const shutdown = async () => {
    server.close()
    await telegram.shutdown()
    process.exit(0)
  }
  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())
}

main().catch((error) => {
  console.error('Serverni ishga tushirib bo‘lmadi:', error)
  process.exit(1)
})
