/**
 * Dashboard: page renders, navbar strings match i18n, quick-log button
 * for "Home Office" is present.
 */
import { test, expect } from '../fixtures/test'
import { DashboardPage } from '../pages/dashboard.page'
import { t } from '../fixtures/i18n'

test.describe('dashboard', () => {
  test('renders navbar with translated links', async ({ authedPage }) => {
    await authedPage.goto('/dashboard')

    await expect(authedPage).toHaveURL(/\/dashboard/)

    for (const key of ['dashboard', 'calendar', 'statistics', 'export', 'settings']) {
      const links = authedPage.getByRole('link', { name: t(`nav.${key}`) })
      await expect(links.first()).toBeVisible()
    }
  })

  test('shows quick-log heading and home-office button', async ({ authedPage }) => {
    const dash = new DashboardPage(authedPage)
    await dash.goto()
    await expect(dash.heading).toBeVisible({ timeout: 10_000 })
    await expect(dash.homeOfficeButton).toBeVisible()
  })

  test('logging home office via API is reflected in list', async ({ authedPage, user }) => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    const res = await authedPage.request.post('/api/attendance', {
      data: {
        date: today.toISOString().slice(0, 10),
        type: 'home',
        transportId: null,
        locationId: null,
      },
    })
    expect(res.status()).toBeLessThan(300)

    const list = await authedPage.request.get(`/api/attendance?month=${today.toISOString().slice(0, 7)}`)
    const body = await list.json()
    expect(body.length).toBeGreaterThan(0)
    expect(body[0].userId).toBe(user.id)
    expect(body[0].type).toBe('home')
  })
})
