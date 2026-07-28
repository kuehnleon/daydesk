/**
 * Global setup for Playwright: apply the Prisma schema to the test DB.
 *
 * Runs a single time before any test/setup project. By the time this runs,
 * playwright.config.ts has already shrouded any developer `.env` files, so
 * both Prisma and Next.js see the test values from `.env.test`.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { resetDb, disconnect } from './fixtures/db'

const REPO_ROOT = path.resolve(__dirname, '..')

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Create `.env.test` at repo root (see e2e/README.md) or export the var in your shell.',
    )
  }
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
      'NEXTAUTH_SECRET is not set. E2E tests mint next-auth JWTs with this secret; it must match the value the app runs with.',
    )
  }

  const migrationsDir = path.join(REPO_ROOT, 'prisma', 'migrations')
  const hasMigrations =
    fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0

  const cmd = hasMigrations
    ? 'npx prisma migrate deploy'
    : 'npx prisma db push --skip-generate --accept-data-loss'

  console.log(`[e2e] applying schema: ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: REPO_ROOT, env: process.env })

  await resetDb()
  await disconnect()
}
