/**
 * Settings page object.
 */
import type { Page, Locator } from '@playwright/test'
import { t } from '../fixtures/i18n'

export class SettingsPage {
  readonly page: Page
  readonly transportSection: Locator
  readonly locationSection: Locator
  readonly languageLabel: Locator

  constructor(page: Page) {
    this.page = page
    this.transportSection = page.getByRole('heading', { name: t('settings.transportMethods') })
    this.locationSection = page.getByRole('heading', { name: t('settings.yourLocations') })
    this.languageLabel = page.getByText(t('settings.language'), { exact: true }).first()
  }

  async goto() {
    await this.page.goto('/settings')
  }
}
