/**
 * Base test fixture. Every spec imports `test`/`expect` from here.
 *
 * Provides:
 *   - resetBefore   Truncates DB before the test (default: true; opt out for state-sharing suites)
 *   - user          A freshly-created, onboarded user available for the test
 *   - authedPage    A page whose context already has that user's session cookie
 */
import { test as base, expect, type Page } from '@playwright/test'
import { resetDb } from './db'
import { createUser, type SeededUser } from './seed'
import { signIn } from './auth'

export interface DaydeskFixtures {
  resetBefore: boolean
  user: SeededUser
  authedPage: Page
}

export const test = base.extend<DaydeskFixtures>({
  resetBefore: [true, { option: true }],

   
  user: async ({ resetBefore }, use) => {
    if (resetBefore) await resetDb()
    const u = await createUser({ onboardingCompleted: true })
    await use(u)
  },

  authedPage: async ({ context, user, baseURL }, use) => {
    if (!baseURL) throw new Error('baseURL missing from Playwright config')
    await signIn(context, user.id, { baseURL, email: user.email, name: user.name })
    const page = await context.newPage()
    await use(page)
  },
})

export { expect }
