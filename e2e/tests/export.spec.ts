/**
 * Export CSV: seed attendance, click Export CSV, capture download, parse & assert.
 */
import { test, expect } from '../fixtures/test'
import { ExportPage } from '../pages/export.page'
import { seedAttendance, seedLocation } from '../fixtures/seed'
import fs from 'node:fs'
import path from 'node:path'

test.describe('export', () => {
  test('exports a CSV with the seeded rows', async ({ authedPage, user }) => {
    // Seed 3 attendance days in a known range (Mon 6 Jul 2026 → Wed 8 Jul 2026).
    const loc = await seedLocation(user.id, 'Office X', { color: '#3B5BDB' })
    for (const dayOffset of [0, 1, 2]) {
      await seedAttendance(user.id, new Date(2026, 6, 6 + dayOffset), 'office', { locationId: loc.id })
    }

    const exportPage = new ExportPage(authedPage)
    await exportPage.goto()

    // Wait for the inputs to be ready before filling.
    await expect(exportPage.startDateInput).toBeVisible()
    await exportPage.startDateInput.fill('2026-07-01')
    await exportPage.endDateInput.fill('2026-07-31')
    // Nudge blur so React state absorbs the value.
    await exportPage.endDateInput.press('Tab')

    const downloadPromise = authedPage.waitForEvent('download')
    await exportPage.exportCsvButton.click()
    const download = await downloadPromise

    // Read the downloaded CSV
    const tempPath = path.join(process.env.RUNNER_TEMP ?? '/tmp', `daydesk-e2e-${Date.now()}.csv`)
    await download.saveAs(tempPath)
    const csv = fs.readFileSync(tempPath, 'utf8')
    fs.unlinkSync(tempPath)

    const lines = csv.trim().split(/\r?\n/)
    expect(lines.length).toBeGreaterThanOrEqual(4) // header + 3 rows
    expect(lines[0].toLowerCase()).toContain('date')
    // 3 data rows contain "office" in the type column.
    const officeRows = lines.slice(1).filter((l) => l.toLowerCase().includes('office'))
    expect(officeRows.length).toBe(3)
  })

  test('shows an error toast when dates are missing', async ({ authedPage }) => {
    const exportPage = new ExportPage(authedPage)
    await exportPage.goto()
    await exportPage.exportCsvButton.click()
    // Error toast — scope to the Notifications region so we don't collide with
    // Next.js's route announcer (which is also role="alert").
    const toast = authedPage.getByRole('region', { name: 'Notifications' }).getByRole('alert')
    await expect(toast).toBeVisible({ timeout: 5000 })
  })
})
