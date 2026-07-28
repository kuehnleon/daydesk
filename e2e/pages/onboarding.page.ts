/**
 * Onboarding wizard page object.
 */
import type { Page, Locator } from '@playwright/test'

export class OnboardingPage {
  readonly page: Page
  readonly nextButton: Locator
  readonly skipButton: Locator

  constructor(page: Page) {
    this.page = page
    this.nextButton = page.getByRole('button', { name: /next|continue|weiter/i })
    this.skipButton = page.getByRole('button', { name: /skip|überspringen/i })
  }

  async goto() {
    await this.page.goto('/onboarding')
  }
}
