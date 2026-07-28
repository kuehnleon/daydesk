/**
 * Settings — location CRUD via the UI. Exercises the aria-labels added to
 * the icon buttons in location-settings.tsx.
 */
import { test, expect } from '../fixtures/test'
import { prisma } from '../fixtures/db'
import { t } from '../fixtures/i18n'

test.describe('settings — locations', () => {
  test('create → rename → delete a location via the UI', async ({ authedPage, user }) => {
    await authedPage.goto('/settings')
    await expect(authedPage.getByRole('heading', { name: t('settings.yourLocations') })).toBeVisible()

    // ---- Add ----
    // The Locations card is the ancestor of the "Your Locations" heading. Its
    // header row has an "Add" button; scope to that heading's parent card.
    const locationsCard = authedPage
      .locator('.card', {
        has: authedPage.getByRole('heading', { name: t('settings.yourLocations') }),
      })
    await locationsCard.getByRole('button', { name: t('settings.add') }).click()

    // Modal opens — assert then fill within the dialog.
    const dialog = authedPage.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // Only one textbox in the modal — the "Name" input.
    await dialog.getByRole('textbox').fill('Berlin Office')
    await dialog.getByRole('button', { name: t('settings.add') }).click()

    await expect.poll(
      async () => prisma.location.count({ where: { userId: user.id, name: 'Berlin Office' } }),
      { timeout: 5000 },
    ).toBe(1)

    // ---- Edit ----
    await authedPage.getByRole('button', { name: /Edit Berlin Office/i }).click()
    const editDialog = authedPage.getByRole('dialog')
    await editDialog.getByRole('textbox').fill('Berlin Hub')
    await editDialog.getByRole('button', { name: t('settings.save') }).click()

    await expect.poll(
      async () => prisma.location.findFirst({ where: { userId: user.id }, select: { name: true } }),
      { timeout: 5000 },
    ).toMatchObject({ name: 'Berlin Hub' })

    // ---- Delete ----
    await authedPage.getByRole('button', { name: /Delete Berlin Hub/i }).click()
    // Confirm dialog appears — destructive → click Delete label.
    await authedPage.getByRole('dialog').getByRole('button', { name: t('settings.delete') }).click()

    await expect.poll(
      async () => prisma.location.count({ where: { userId: user.id } }),
      { timeout: 5000 },
    ).toBe(0)
  })
})
