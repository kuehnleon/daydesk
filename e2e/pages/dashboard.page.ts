/**
 * Dashboard page object.
 */
import type { Page, Locator } from '@playwright/test'
import { t } from '../fixtures/i18n'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly homeOfficeButton: Locator
  readonly dayOffButton: Locator
  readonly sickButton: Locator
  readonly actionModal: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: t('dashboard.quickLog') })
    this.homeOfficeButton = page.getByRole('button', { name: t('dashboard.homeOffice') })
    this.dayOffButton = page.getByRole('button', { name: t('dashboard.dayOff') })
    this.sickButton = page.getByRole('button', { name: t('dashboard.sick') })
    this.actionModal = page.locator('[role="dialog"][aria-labelledby="card-action-modal-title"]')
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  /**
   * Simulate a long-press on `card` by pressing the mouse down over its
   * centre, holding past the 500ms threshold, then releasing. Mirrors
   * the calendar POM's drag helper.
   */
  async longPressCard(card: Locator, holdMs = 700) {
    const box = await card.boundingBox()
    if (!box) throw new Error('card has no bounding box')
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    await this.page.mouse.move(cx, cy)
    await this.page.mouse.down()
    await this.page.waitForTimeout(holdMs)
    await this.page.mouse.up()
  }
}
