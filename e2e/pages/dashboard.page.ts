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

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: t('dashboard.quickLog') })
    this.homeOfficeButton = page.getByRole('button', { name: t('dashboard.homeOffice') })
    this.dayOffButton = page.getByRole('button', { name: t('dashboard.dayOff') })
    this.sickButton = page.getByRole('button', { name: t('dashboard.sick') })
  }

  async goto() {
    await this.page.goto('/dashboard')
  }
}
