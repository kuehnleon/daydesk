/**
 * Settings — transport CRUD via the UI. Exercises the aria-labels added to
 * the icon buttons in transport-settings.tsx.
 */
import { test, expect } from '../fixtures/test'
import { prisma } from '../fixtures/db'
import { t } from '../fixtures/i18n'

test.describe('settings — transports', () => {
  test('create → rename → delete a transport via the UI', async ({ authedPage, user }) => {
    await authedPage.goto('/settings')
    await expect(authedPage.getByRole('heading', { name: t('settings.transportMethods') })).toBeVisible()

    // Scope to the Transports card via its heading.
    const transportCard = authedPage
      .locator('.card', {
        has: authedPage.getByRole('heading', { name: t('settings.transportMethods') }),
      })
    await transportCard.getByRole('button', { name: t('settings.add') }).click()

    const dialog = authedPage.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('textbox').fill('Bike')
    await dialog.getByRole('button', { name: t('settings.add') }).click()

    await expect.poll(
      async () => prisma.transport.count({ where: { userId: user.id, name: 'Bike' } }),
      { timeout: 5000 },
    ).toBe(1)

    // Edit
    await authedPage.getByRole('button', { name: /Edit Bike/i }).click()
    const editDialog = authedPage.getByRole('dialog')
    await editDialog.getByRole('textbox').fill('E-Bike')
    await editDialog.getByRole('button', { name: t('settings.save') }).click()

    await expect.poll(
      async () => prisma.transport.findFirst({ where: { userId: user.id }, select: { name: true } }),
      { timeout: 5000 },
    ).toMatchObject({ name: 'E-Bike' })

    // Delete
    await authedPage.getByRole('button', { name: /Delete E-Bike/i }).click()
    await authedPage.getByRole('dialog').getByRole('button', { name: t('settings.delete') }).click()

    await expect.poll(
      async () => prisma.transport.count({ where: { userId: user.id } }),
      { timeout: 5000 },
    ).toBe(0)
  })
})
