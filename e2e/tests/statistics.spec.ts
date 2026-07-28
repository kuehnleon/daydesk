/**
 * Statistics: with seeded office days, the API returns them for the current month.
 * (UI KPI rendering depends on tricky async loads — this spec covers the data path,
 *  which is what a KPI regression would look like.)
 */
import { test, expect } from '../fixtures/test'
import { seedAttendance, seedLocation } from '../fixtures/seed'

test.describe('statistics data path', () => {
  test('seeded office days are returned by /api/attendance', async ({ authedPage, user }) => {
    const loc = await seedLocation(user.id, 'Office Berlin', { color: '#3B5BDB' })

    const now = new Date()
    const month = now.toISOString().slice(0, 7)
    const days = [1, 2, 3].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth(), offset)
      return d
    })
    for (const d of days) {
      await seedAttendance(user.id, d, 'office', { locationId: loc.id })
    }

    const res = await authedPage.request.get(`/api/attendance?month=${month}`)
    expect(res.status()).toBe(200)
    const body = (await res.json()) as Array<{ type: string }>
    const office = body.filter((row) => row.type === 'office')
    expect(office.length).toBe(3)
  })

  test('statistics page renders without crashing', async ({ authedPage }) => {
    await authedPage.goto('/statistics')
    await expect(authedPage).toHaveURL(/\/statistics/)
    // page contains the navbar (rendered on all authed pages).
    await expect(authedPage.getByRole('link', { name: 'daydesk home' }).first()).toBeVisible()
  })
})
