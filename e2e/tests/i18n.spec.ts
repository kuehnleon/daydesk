/**
 * i18n: forcing the NEXT_LOCALE cookie to `de` shows German copy in the navbar.
 *
 * Uses a custom user with `locale: 'de'` in the DB so that `LocaleSync` (which
 * fetches `/api/settings` post-mount and reloads if the cookie disagrees with
 * the user's saved locale) doesn't stomp the cookie back to `en` mid-test.
 */
import { test, expect } from '../fixtures/test'
import { createUser } from '../fixtures/seed'
import { signIn } from '../fixtures/auth'
import { t } from '../fixtures/i18n'

test.describe('i18n', () => {
  test('navbar renders German copy when NEXT_LOCALE=de', async ({ context, baseURL }) => {
    const user = await createUser({ email: 'de-user@example.test', locale: 'de' })
    await signIn(context, user.id, { baseURL: baseURL!, email: user.email, name: user.name })

    // signIn writes NEXT_LOCALE=en; override with de for this test.
    const host = new URL(baseURL!).hostname
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'de', domain: host, path: '/', sameSite: 'Lax' }])

    const page = await context.newPage()
    await page.goto('/dashboard')
    // German nav labels (from messages/de.json). Assert on labels that differ
    // between en and de — `Dashboard` is identical in both, so it would pass
    // even if the page rendered in English.
    await expect(page.getByRole('link', { name: t('nav.calendar', 'de') }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: t('nav.settings', 'de') }).first()).toBeVisible()
  })
})
