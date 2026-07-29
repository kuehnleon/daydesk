import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Auto-cleanup the DOM between tests (RTL doesn't do this on its own with
// Vitest's globals; it does under Jest).
afterEach(() => {
  cleanup()
})
