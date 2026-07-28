/**
 * Onboarding flow: a fresh user is redirected from /dashboard to /onboarding,
 * and completing the wizard flips `onboardingCompleted` in the DB.
 */
import { test, expect } from '../fixtures/test'
import { prisma } from '../fixtures/db'

test.describe('onboarding', () => {
  // Override the default user with a fresh, un-onboarded one.
  test.use({})

  test('un-onboarded user is redirected from /dashboard to /onboarding', async ({ context, baseURL, resetBefore }) => {
    if (resetBefore) {
      // resetBefore fixture already ran via ./fixtures/test.ts's `user` fixture,
      // but here we ignore that user — instead create a fresh, un-onboarded one.
    }
    const { createUser } = await import('../fixtures/seed')
    const { signIn } = await import('../fixtures/auth')

    const fresh = await createUser({
      email: 'fresh@example.test',
      onboardingCompleted: false,
    })
    await signIn(context, fresh.id, { baseURL: baseURL!, email: fresh.email, name: fresh.name })

    const page = await context.newPage()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 })
  })

  test('completing skip flips onboardingCompleted in DB', async ({ context, baseURL }) => {
    const { createUser } = await import('../fixtures/seed')
    const { signIn } = await import('../fixtures/auth')

    const fresh = await createUser({
      email: 'skip@example.test',
      onboardingCompleted: false,
    })
    await signIn(context, fresh.id, { baseURL: baseURL!, email: fresh.email, name: fresh.name })

    // Simulate the wizard's skip via API (same call the wizard makes).
    const page = await context.newPage()
    await page.goto('/onboarding')
    const res = await page.request.patch('/api/settings', {
      data: { onboardingCompleted: true },
    })
    expect(res.status()).toBe(200)

    const dbUser = await prisma.user.findUnique({ where: { id: fresh.id } })
    expect(dbUser?.onboardingCompleted).toBe(true)
  })
})
