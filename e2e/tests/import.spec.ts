/**
 * CSV import: upload a CSV whose location/transport names already exist,
 * so no mapping dialog appears; click Import; assert prisma.
 *
 * The mapping UI is intentionally NOT exercised here — that flow is complex
 * and worth its own targeted spec later.
 */
import { test, expect } from '../fixtures/test'
import { prisma } from '../fixtures/db'
import { seedLocation, seedTransport } from '../fixtures/seed'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

test.describe('import CSV', () => {
  test('imports rows whose names already exist', async ({ authedPage, user }) => {
    // Seed the referenced names first.
    const transport = await seedTransport(user.id, 'Bike')
    await seedLocation(user.id, 'Office X', { color: '#3B5BDB', transportId: transport.id })

    // Write a temp CSV.
    const csv = [
      'Date,Type,Location,Transport,Distance (km),Notes',
      '2026-07-06,office,Office X,Bike,10,',
      '2026-07-07,office,Office X,Bike,10,',
      '2026-07-08,home,,,,',
    ].join('\n')
    const tmp = path.join(os.tmpdir(), `daydesk-import-${Date.now()}.csv`)
    fs.writeFileSync(tmp, csv)

    await authedPage.goto('/export')
    await authedPage.locator('input[type="file"]').setInputFiles(tmp)

    // Wait for the "Import N Rows" button to appear.
    const importBtn = authedPage.getByRole('button', { name: /import.*rows?/i })
    await expect(importBtn).toBeEnabled({ timeout: 5000 })
    await importBtn.click()

    // Wait for the DB to reflect the imported rows.
    await expect.poll(
      async () => prisma.attendance.count({ where: { userId: user.id } }),
      { timeout: 10_000 },
    ).toBe(3)

    fs.unlinkSync(tmp)
  })
})
