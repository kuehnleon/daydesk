/**
 * Calendar page object.
 */
import type { Page, Locator } from '@playwright/test'

export class CalendarPage {
  readonly page: Page
  readonly prevMonth: Locator
  readonly nextMonth: Locator
  readonly modal: Locator

  constructor(page: Page) {
    this.page = page
    this.prevMonth = page.getByRole('button', { name: 'Previous month' })
    this.nextMonth = page.getByRole('button', { name: 'Next month' })
    // The attendance modal has aria-labelledby="attendance-modal-title" — a
    // stable identifier that distinguishes it from the confirm dialog and
    // settings modals (which also use role="dialog").
    this.modal = page.locator('[role="dialog"][aria-labelledby="attendance-modal-title"]')
  }

  async goto() {
    await this.page.goto('/calendar')
  }

  /** Returns the day-cell locator for a specific ISO date string (yyyy-MM-dd). */
  day(dateStr: string): Locator {
    return this.page.locator(`button[data-date="${dateStr}"]`)
  }

  /**
   * Drag-select a range from startDate to endDate inclusive.
   * Uses mouse events (mousedown → mouseenter across cells → mouseup).
   */
  async dragSelect(startDate: string, endDate: string) {
    const from = this.day(startDate)
    const to = this.day(endDate)
    const fromBox = await from.boundingBox()
    const toBox = await to.boundingBox()
    if (!fromBox || !toBox) throw new Error(`Cell(s) not visible: ${startDate}..${endDate}`)

    await this.page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2)
    await this.page.mouse.down()
    // Move via each intermediate cell so onMouseEnter fires per day
    await this.page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 10 })
    await this.page.mouse.up()
  }

  async waitForModal() {
    await this.modal.waitFor({ state: 'visible' })
  }
}
