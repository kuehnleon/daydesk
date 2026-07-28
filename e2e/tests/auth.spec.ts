/**
 * Auth: the API gates itself on `await auth()`. An unauthenticated
 * client should get 401 on protected endpoints; an authenticated one 200.
 *
 * (There is a `src/proxy.ts` that looks like Next.js middleware but is
 * mis-named — Next.js only picks up `middleware.ts` at src/ or root.
 * So we assert what the app actually does today: API gating, not a
 * server-side redirect.)
 */
import { test, expect } from '../fixtures/test'

test.describe('auth', () => {
  test('unauthenticated API returns 401 for protected endpoint', async ({ playwright, baseURL }) => {
    // Explicit empty storageState — the project-level default is the configured
    // user, and request.newContext inherits it unless we override.
    const anon = await playwright.request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    })
    const res = await anon.get('/api/attendance?month=2026-07')
    expect(res.status()).toBe(401)
    await anon.dispose()
  })

  test('authenticated user can reach protected API', async ({ authedPage }) => {
    const res = await authedPage.request.get('/api/attendance?month=2026-07')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('authenticated user reaches dashboard page', async ({ authedPage }) => {
    await authedPage.goto('/dashboard')
    await expect(authedPage.getByRole('link', { name: 'daydesk home' }).first()).toBeVisible()
  })
})
