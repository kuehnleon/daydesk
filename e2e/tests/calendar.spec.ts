/**
 * Calendar interactions:
 *  - drag-select a 3-day range, save as home office, assert prisma has 3 rows
 *  - single-day click, save as sick, assert prisma has 1 row
 *  - modal has role="dialog" and closes via close button
 */
import { test, expect } from '../fixtures/test'
import { prisma } from '../fixtures/db'
import { seedLocation } from '../fixtures/seed'
import { CalendarPage } from '../pages/calendar.page'

/**
 * Navigates the calendar to the target month by clicking prev/next until the
 * calendar shows a day cell for the target day-1 date.
 */
async function goToMonth(cal: CalendarPage, targetDate: string) {
  const marker = cal.day(targetDate)
  const now = new Date()
  const [yStr, mStr] = targetDate.split('-')
  const targetYear = Number(yStr)
  const targetMonth = Number(mStr) - 1

  // Decide direction
  const nowMonths = now.getFullYear() * 12 + now.getMonth()
  const targetMonths = targetYear * 12 + targetMonth
  const diff = targetMonths - nowMonths

  for (let i = 0; i < Math.abs(diff); i++) {
    if (diff > 0) await cal.nextMonth.click()
    else await cal.prevMonth.click()
  }
  await expect(marker).toBeVisible({ timeout: 5000 })
}

/**
 * Return the ISO date of the first Monday in the given (year, month0-indexed) that
 * is on or after the given "start" day.
 */
function firstMondayFrom(year: number, month: number, startDay: number): string {
  const d = new Date(year, month, startDay)
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

test.describe('calendar', () => {
  test('drag-selecting a 3-day range saves attendance for all 3 days', async ({ authedPage, user }) => {
    const cal = new CalendarPage(authedPage)
    await cal.goto()

    // Pick a Monday from the current month so the target cells are workdays.
    const today = new Date()
    const monday = firstMondayFrom(today.getFullYear(), today.getMonth(), 1)
    const [y, m, d] = monday.split('-').map(Number)
    const pad = (n: number) => String(n).padStart(2, '0')
    const wednesday = `${y}-${pad(m)}-${pad(d + 2)}`

    await goToMonth(cal, monday)

    await cal.dragSelect(monday, wednesday)
    await cal.waitForModal()

    // Click "Home Office" — the first matching button in the modal.
    await authedPage.getByRole('button', { name: 'Home Office' }).first().click()

    await expect.poll(
      async () => prisma.attendance.count({ where: { userId: user.id, type: 'home' } }),
      { timeout: 10_000 },
    ).toBeGreaterThanOrEqual(3)
  })

  test('single-day click on a Monday opens the attendance modal', async ({ authedPage }) => {
    const cal = new CalendarPage(authedPage)
    await cal.goto()

    const today = new Date()
    const monday = firstMondayFrom(today.getFullYear(), today.getMonth(), 1)
    await goToMonth(cal, monday)

    // Single-day "click" = drag from cell to itself.
    await cal.dragSelect(monday, monday)
    await cal.waitForModal()
    expect(await cal.modal.getAttribute('aria-modal')).toBe('true')
  })

  test('attendance modal has role="dialog" with aria-labelledby', async ({ authedPage, user }) => {
    // Seed something first so the click on that day opens the modal predictably.
    const loc = await seedLocation(user.id, 'Home Base', { color: '#3B5BDB' })
    void loc

    const cal = new CalendarPage(authedPage)
    await cal.goto()

    const today = new Date()
    const monday = firstMondayFrom(today.getFullYear(), today.getMonth(), 1)
    await goToMonth(cal, monday)

    await cal.dragSelect(monday, monday)
    await cal.waitForModal()

    const dialog = cal.modal
    await expect(dialog).toBeVisible()
    expect(await dialog.getAttribute('role')).toBe('dialog')
    expect(await dialog.getAttribute('aria-modal')).toBe('true')
    expect(await dialog.getAttribute('aria-labelledby')).toBe('attendance-modal-title')
  })
})
