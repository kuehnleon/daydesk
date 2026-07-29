/**
 * Long-press on a dashboard card opens a per-card action modal so the
 * user can override the transport method and add a note for today
 * without switching to the calendar view.
 *
 * Regression: a plain (short) click keeps its "log with defaults"
 * behaviour and does NOT open the modal.
 */
import { test, expect } from '../fixtures/test'
import { prisma } from '../fixtures/db'
import { seedLocation, seedTransport } from '../fixtures/seed'
import { DashboardPage } from '../pages/dashboard.page'
import { t } from '../fixtures/i18n'

const todayIso = () => new Date().toISOString().slice(0, 10)
const todayMonth = () => new Date().toISOString().slice(0, 7)

test.describe('dashboard long-press action modal', () => {
  test('long-press office card lets user pick a non-default transport and save', async ({ authedPage, user }) => {
    const car = await seedTransport(user.id, 'Car', 0)
    const bike = await seedTransport(user.id, 'Bike', 1)
    const loc = await seedLocation(user.id, 'Munich Office', {
      color: '#3B5BDB',
      transportId: car.id,
    })

    const dash = new DashboardPage(authedPage)
    await dash.goto()
    await expect(dash.heading).toBeVisible({ timeout: 10_000 })

    const card = authedPage.getByRole('button', { name: /Munich Office/ })
    await expect(card).toBeVisible()

    await dash.longPressCard(card)
    await expect(dash.actionModal).toBeVisible()

    // Bike is not the location default → picking it must override the
    // default transport for today.
    await dash.actionModal.getByRole('button', { name: /Bike/ }).click()
    await dash.actionModal.getByRole('button', { name: t('dashboard.save') }).click()

    await expect.poll(
      async () => {
        const rows = await prisma.attendance.findMany({
          where: { userId: user.id, type: 'office' },
        })
        return rows[0]?.transportId ?? null
      },
      { timeout: 10_000 },
    ).toBe(bike.id)

    // Sanity: location was preserved.
    const row = await prisma.attendance.findFirst({ where: { userId: user.id, type: 'office' } })
    expect(row?.locationId).toBe(loc.id)
    expect(row?.date.toISOString().slice(0, 10)).toBe(todayIso())
  })

  test('long-press home card lets user add a note without a transport', async ({ authedPage, user }) => {
    const dash = new DashboardPage(authedPage)
    await dash.goto()
    await expect(dash.heading).toBeVisible({ timeout: 10_000 })

    await dash.longPressCard(dash.homeOfficeButton)
    await expect(dash.actionModal).toBeVisible()

    // Home target must NOT show the transport picker heading.
    await expect(dash.actionModal.getByText(t('calendar.selectTransport'))).toHaveCount(0)

    await dash.actionModal.getByPlaceholder(t('calendar.notePlaceholder')).fill('Focus day')
    await dash.actionModal.getByRole('button', { name: t('dashboard.save') }).click()

    await expect.poll(
      async () => {
        const rows = await prisma.attendance.findMany({
          where: { userId: user.id, type: 'home' },
        })
        return rows[0]?.notes ?? null
      },
      { timeout: 10_000 },
    ).toBe('Focus day')
  })

  test('short click on a location card still logs with the default transport and does not open the modal', async ({ authedPage, user }) => {
    const car = await seedTransport(user.id, 'Car', 0)
    await seedLocation(user.id, 'Munich Office', {
      color: '#3B5BDB',
      transportId: car.id,
    })

    const dash = new DashboardPage(authedPage)
    await dash.goto()
    await expect(dash.heading).toBeVisible({ timeout: 10_000 })

    const card = authedPage.getByRole('button', { name: /Munich Office/ })
    await card.click()

    // Modal must not appear.
    await expect(dash.actionModal).toHaveCount(0)

    // Attendance was posted with the location's default transport.
    await expect.poll(
      async () => {
        const list = await authedPage.request.get(`/api/attendance?month=${todayMonth()}`)
        const rows = (await list.json()) as Array<{ type: string; transportId: string | null }>
        return rows.find(r => r.type === 'office')?.transportId ?? null
      },
      { timeout: 10_000 },
    ).toBe(car.id)
  })

  test('backdrop click closes the modal without saving', async ({ authedPage, user }) => {
    await seedLocation(user.id, 'Munich Office', { color: '#3B5BDB' })

    const dash = new DashboardPage(authedPage)
    await dash.goto()
    await expect(dash.heading).toBeVisible({ timeout: 10_000 })

    const card = authedPage.getByRole('button', { name: /Munich Office/ })
    await dash.longPressCard(card)
    await expect(dash.actionModal).toBeVisible()

    // Click on the backdrop (top-left of viewport is inside the fixed
    // inset-0 overlay but outside the dialog).
    await authedPage.mouse.click(5, 5)
    await expect(dash.actionModal).toHaveCount(0)

    const rows = await prisma.attendance.findMany({ where: { userId: user.id } })
    expect(rows.length).toBe(0)
  })
})
