import fs from 'node:fs'
import path from 'node:path'
import { disconnect } from './fixtures/db'

/**
 * Restore any .env files that playwright.config.ts shrouded at run start.
 * (The atexit handlers in playwright.config.ts are a fallback for crashes.)
 */
function unshroud() {
  const manifestPath = path.resolve(__dirname, '..', '.env.shroud-manifest.json')
  if (!fs.existsSync(manifestPath)) return
  try {
    const entries: Array<{ from: string; to: string }> = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8'),
    )
    for (const { from, to } of entries) {
      if (fs.existsSync(to) && !fs.existsSync(from)) {
        fs.renameSync(to, from)
      }
    }
    fs.unlinkSync(manifestPath)
  } catch { /* best-effort */ }
}

export default async function globalTeardown() {
  unshroud()
  await disconnect()
}
