import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

/**
 * Playwright configuration for daydesk E2E tests.
 *
 * Environment variables:
 *   PLAYWRIGHT_BASE_URL   Point at an already-running server (skips webServer)
 *   PLAYWRIGHT_USE_BUILD  If '1', run `next build && next start` instead of `next dev`
 *   DATABASE_URL          Postgres connection (required — see e2e/global-setup.ts)
 *   NEXTAUTH_SECRET       Same secret the app uses; must be set to mint fake sessions
 *
 * Locally, put the above (and OAuth placeholders) in a `.env.test` file at repo
 * root. This config loads it into process.env, then temporarily "shrouds" any
 * existing `.env` / `prisma/.env` (renames them out of the way) so Next.js AND
 * Prisma pick up the test env. Files are restored on global teardown — see
 * e2e/global-teardown.ts.
 */

const envTestPath = path.resolve(__dirname, '.env.test')
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath, override: true })
}

// Shroud developer's real .env for the duration of the run — Next.js and
// Prisma both auto-load .env from their working directory / schema dir and
// would otherwise override the test values loaded above.
const ENV_FILES_TO_SHROUD = [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, 'prisma', '.env'),
]
const shroudManifestPath = path.resolve(__dirname, '.env.shroud-manifest.json')

if (!fs.existsSync(shroudManifestPath)) {
  const shrouded: Array<{ from: string; to: string }> = []
  for (const from of ENV_FILES_TO_SHROUD) {
    if (fs.existsSync(from)) {
      const to = `${from}.e2e-shrouded`
      fs.renameSync(from, to)
      shrouded.push({ from, to })
    }
  }
  fs.writeFileSync(shroudManifestPath, JSON.stringify(shrouded, null, 2))
  // Belt-and-braces: if the run crashes hard, an atexit hook still restores.
  const restore = () => {
    try {
      const raw = fs.readFileSync(shroudManifestPath, 'utf8')
      const entries: Array<{ from: string; to: string }> = JSON.parse(raw)
      for (const { from, to } of entries) {
        if (fs.existsSync(to) && !fs.existsSync(from)) {
          fs.renameSync(to, from)
        }
      }
      fs.unlinkSync(shroudManifestPath)
    } catch { /* ignore */ }
  }
  process.on('exit', restore)
  process.on('SIGINT', () => { restore(); process.exit(130) })
  process.on('SIGTERM', () => { restore(); process.exit(143) })
}

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

const useBuild = process.env.PLAYWRIGHT_USE_BUILD === '1'

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.(spec|setup)\.ts/,
  outputDir: './test-results',
  fullyParallel: false, // shared DB — parallelism is opt-in per test
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // one worker keeps DB semantics simple; can increase per-project later
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'on-failure' }], ['list']],

  globalSetup: path.resolve(__dirname, './e2e/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, './e2e/global-teardown.ts'),

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    timezoneId: 'Europe/Berlin',
    // Force en locale via cookie so tests don't depend on browser Accept-Language
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  projects: [
    // Setup project — logs in each named role, saves storageState
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Main test project — depends on setup, uses the 'configured' user by default
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/configured.json',
      },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: useBuild
          ? `npx dotenv -e .env.test -c -- sh -c 'npm run build && npx next start -p ${PORT}'`
          : `npx dotenv -e .env.test -c -- npx next dev -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
