/**
 * Visual regression matrix: 4 pages × 2 themes × 2 locales × 2 viewports = 16 snapshots.
 *
 * The current-time-dependent parts of the UI are the dashboard's "today" line
 * and the calendar's "today" ring. We handle both by freezing the browser
 * clock to a fixed instant with `page.clock.install`, seeding a stable dataset
 * around that instant, and setting a fixed viewport / device scale.
 *
 * Snapshots live under `visual-regression.spec.ts-snapshots/`. To update
 * baselines after an intentional UI change, run:
 *
 *   npm run test:e2e -- visual-regression --update-snapshots
 *
 * IMPORTANT: baselines must be generated on the same OS as CI (Linux). Local
 * macOS baselines will diff. See e2e/README.md for the Docker one-liner.
 */
import { test, expect, type Page } from '@playwright/test'
import { makeSessionCookie } from '../fixtures/auth'
import { resetDb, prisma } from '../fixtures/db'
import { createUser, seedLocation, seedTransport, seedAttendance } from '../fixtures/seed'

/** Frozen wall clock; matches the dataset the tests seed below. */
const FROZEN_INSTANT = '2026-07-15T09:00:00.000Z'
const FROZEN_YEAR = 2026
const FROZEN_MONTH = 6 // July (0-indexed)

const PAGES = [
  { name: 'dashboard', url: '/dashboard' },
  { name: 'calendar', url: '/calendar' },
  { name: 'statistics', url: '/statistics' },
  { name: 'settings', url: '/settings' },
] as const

const THEMES = ['light', 'dark'] as const
const LOCALES = ['en', 'de'] as const
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720, deviceScaleFactor: 1 },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 },
] as const

/**
 * Seed a deterministic dataset for the frozen instant.
 * Called by the setup fixture below (via test.beforeAll analogue).
 */
async function seedStableDataset() {
  await resetDb()

  const user = await createUser({
    email: 'visual@example.test',
    name: 'Visual Test User',
    country: 'DE',
    defaultState: 'BW',
    onboardingCompleted: true,
  })

  const bike = await seedTransport(user.id, 'Bike')
  const car = await seedTransport(user.id, 'Car', 1)
  await seedLocation(user.id, 'Office Berlin', { color: '#3B5BDB', transportId: bike.id, sortOrder: 0 })
  await seedLocation(user.id, 'Office Munich', { color: '#EF4444', transportId: car.id, sortOrder: 1 })

  // Attendance: 5 days in July 2026 (before the frozen "today" of Jul 15).
  const days = [1, 2, 6, 7, 8]
  const locations = await prisma.location.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: 'asc' },
  })
  for (let i = 0; i < days.length; i++) {
    const date = new Date(FROZEN_YEAR, FROZEN_MONTH, days[i])
    await seedAttendance(user.id, date, 'office', { locationId: locations[i % 2].id })
  }
  return user
}

/**
 * Prepare the page for a deterministic screenshot: set cookies, freeze the
 * clock, wait for fonts + network idle.
 */
async function preparePage(
  page: Page,
  opts: { userId: string; email: string; name: string; baseURL: string; locale: 'en' | 'de' },
) {
  // Session cookie
  const cookie = await makeSessionCookie(opts.userId, {
    baseURL: opts.baseURL,
    email: opts.email,
    name: opts.name,
  })
  await page.context().addCookies([cookie])
  // Locale cookie
  const host = new URL(opts.baseURL).hostname
  await page.context().addCookies([
    { name: 'NEXT_LOCALE', value: opts.locale, domain: host, path: '/', sameSite: 'Lax' },
  ])
  // Freeze wall clock
  await page.clock.install({ time: new Date(FROZEN_INSTANT) })
}

// Nested describe: one describe per (theme × locale × viewport), one test per page.
for (const theme of THEMES) {
  for (const locale of LOCALES) {
    for (const viewport of VIEWPORTS) {
      test.describe(`visual — ${theme} / ${locale} / ${viewport.name}`, () => {
        test.use({
          colorScheme: theme,
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.deviceScaleFactor,
          // Storage state seeded per test to keep the DB deterministic.
          storageState: { cookies: [], origins: [] },
        })

        let userInfo: { id: string; email: string; name: string }
        test.beforeAll(async () => {
          userInfo = await seedStableDataset()
        })

        for (const pg of PAGES) {
          test(`${pg.name}`, async ({ page, baseURL }) => {
            if (!baseURL) throw new Error('baseURL missing')

            await preparePage(page, {
              userId: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
              baseURL,
              locale,
            })

            // Kill all animations/transitions BEFORE navigation via
            // addInitScript so it survives client-side navs. `animations:
            // 'disabled'` on the screenshot pauses running ones but doesn't
            // help if new elements have entrance animations.
            await page.addInitScript(() => {
              const style = document.createElement('style')
              style.textContent = `*, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
              }`
              // Inject as soon as <head> exists.
              const inject = () => {
                if (document.head) {
                  document.head.appendChild(style)
                  return true
                }
                return false
              }
              if (!inject()) {
                const observer = new MutationObserver(() => {
                  if (inject()) observer.disconnect()
                })
                observer.observe(document.documentElement, { childList: true, subtree: true })
              }
            })

            await page.goto(pg.url)

            // Wait for content
            await page.waitForLoadState('networkidle')
            // Skeleton placeholders use `.animate-pulse` — wait for all of
            // them to disappear so we don't screenshot a loading state.
            await page.waitForFunction(
              () => document.querySelectorAll('.animate-pulse').length === 0,
              { timeout: 15_000 },
            )
            // Wait for web-fonts to load so text glyphs are stable.
            // Wrapped in try/catch because a spurious re-render during the
            // wait can destroy the eval context; the initial pageload has
            // already triggered font loading via CSS.
            try {
              await page.evaluate(() => document.fonts?.ready)
            } catch { /* best-effort */ }
            // Small settle for layout to fully stabilize.
            await page.waitForTimeout(500)

            // Snapshot filename includes theme / locale / viewport so each
            // permutation gets its own baseline (Playwright doesn't inject
            // the describe path).
            const snapshotName = `${pg.name}-${theme}-${locale}-${viewport.name}.png`
            await expect(page).toHaveScreenshot(snapshotName, {
              fullPage: false,
              // Allow up to 5% pixel drift — anti-aliasing across GPU stacks
              // and Tailwind's arbitrary-value classes can nudge sub-pixel
              // rounding by a few pixels per glyph. 5% is generous enough to
              // stay green on the same OS while still catching real regressions.
              maxDiffPixelRatio: 0.05,
              animations: 'disabled',
              caret: 'hide',
              // Total budget for the assertion including retries.
              timeout: 20_000,
            })
          })
        }
      })
    }
  }
}
