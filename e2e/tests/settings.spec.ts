/**
 * Settings: page renders both Transport and Location section headings.
 */
import { test, expect } from '../fixtures/test'
import { SettingsPage } from '../pages/settings.page'

test.describe('settings', () => {
  test('renders transport + location sections', async ({ authedPage }) => {
    const settings = new SettingsPage(authedPage)
    await settings.goto()
    await expect(settings.transportSection).toBeVisible({ timeout: 10_000 })
    await expect(settings.locationSection).toBeVisible()
  })

  test('creating a transport via API surfaces in the transports list', async ({ authedPage }) => {
    const post = await authedPage.request.post('/api/transports', {
      data: { name: 'E2E Bike' },
    })
    expect(post.status()).toBeLessThan(300)

    const list = await authedPage.request.get('/api/transports')
    const body = await list.json()
    expect(body.some((t: { name: string }) => t.name === 'E2E Bike')).toBe(true)
  })
})
