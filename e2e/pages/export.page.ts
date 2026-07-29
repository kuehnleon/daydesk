/**
 * Export / Import page object.
 */
import type { Page, Locator } from '@playwright/test'
import { t } from '../fixtures/i18n'

export class ExportPage {
  readonly page: Page
  readonly startDateInput: Locator
  readonly endDateInput: Locator
  readonly exportCsvButton: Locator
  readonly exportPdfButton: Locator
  readonly importFileInput: Locator

  constructor(page: Page) {
    this.page = page
    // The export page has two `type=date` inputs, no labels are wired via
    // htmlFor — grab them by position under the "Start Date" / "End Date" labels.
    this.startDateInput = page.locator('input[type="date"]').nth(0)
    this.endDateInput = page.locator('input[type="date"]').nth(1)
    this.exportCsvButton = page.getByRole('button', { name: t('export.exportCSV') })
    this.exportPdfButton = page.getByRole('button', { name: t('export.exportPDF') })
    this.importFileInput = page.locator('input[type="file"]')
  }

  async goto() {
    await this.page.goto('/export')
  }
}
