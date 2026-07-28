/**
 * i18n: forcing the NEXT_LOCALE cookie to `de` shows German copy in the navbar.
 */
import { test, expect } from '../fixtures/test'
import { t } from '../fixtures/i18n'

test.describe('i18n', () => {
  test('navbar renders German copy when NEXT_LOCALE=de', async ({ context, authedPage, baseURL }) => {
    // Replace the default NEXT_LOCALE=en cookie set by the setup project.
    const host = new URL(baseURL!).hostname
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'de', domain: host, path: '/', sameSite: 'Lax' }])

    await authedPage.goto('/dashboard')
    // German nav labels (from messages/de.json).
    await expect(authedPage.getByRole('link', { name: t('nav.dashboard', 'de') }).first()).toBeVisible()
    await expect(authedPage.getByRole('link', { name: t('nav.settings', 'de') }).first()).toBeVisible()
  })
})
