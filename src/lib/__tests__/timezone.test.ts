import { describe, it, expect } from 'vitest'
import {
  isValidTimezone,
  getCurrentTimeInTimezone,
  getDayOfWeekInTimezone,
  getTodayDateInTimezone,
} from '@/lib/timezone'

describe('isValidTimezone', () => {
  it('returns true for valid IANA timezones', () => {
    expect(isValidTimezone('Europe/Berlin')).toBe(true)
    expect(isValidTimezone('America/New_York')).toBe(true)
    expect(isValidTimezone('UTC')).toBe(true)
  })

  it('returns false for invalid timezones', () => {
    expect(isValidTimezone('Invalid/Timezone')).toBe(false)
    expect(isValidTimezone('')).toBe(false)
    expect(isValidTimezone('foo')).toBe(false)
  })
})

describe('getCurrentTimeInTimezone', () => {
  it('returns HH:mm formatted time', () => {
    // 2026-03-28T12:00:00Z -> 13:00 in Europe/Berlin (CET = UTC+1, CEST starts March 29)
    const date = new Date('2026-03-28T12:00:00Z')
    const result = getCurrentTimeInTimezone(date, 'Europe/Berlin')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
    expect(result).toBe('13:00') // CET = UTC+1
  })

  it('handles UTC correctly', () => {
    const date = new Date('2026-03-28T09:30:00Z')
    const result = getCurrentTimeInTimezone(date, 'UTC')
    expect(result).toBe('09:30')
  })
})

describe('getDayOfWeekInTimezone', () => {
  it('returns correct day for a known date', () => {
    // 2026-03-28 is a Saturday
    const date = new Date('2026-03-28T12:00:00Z')
    const result = getDayOfWeekInTimezone(date, 'UTC')
    expect(result).toBe(6) // Saturday
  })

  it('handles timezone crossing date boundary', () => {
    // Just after midnight UTC on Saturday -> still Friday in US/Pacific (UTC-7)
    const date = new Date('2026-03-28T03:00:00Z')
    const result = getDayOfWeekInTimezone(date, 'America/Los_Angeles')
    expect(result).toBe(5) // Friday in LA
  })
})

describe('getTodayDateInTimezone', () => {
  it('returns midnight UTC date for the given timezone', () => {
    const date = new Date('2026-03-28T23:00:00Z')
    // In Europe/Berlin this is already March 29 (UTC+2 in CEST)
    const result = getTodayDateInTimezone(date, 'Europe/Berlin')
    expect(result.toISOString()).toBe('2026-03-29T00:00:00.000Z')
  })

  it('returns correct date for UTC', () => {
    const date = new Date('2026-03-28T23:00:00Z')
    const result = getTodayDateInTimezone(date, 'UTC')
    expect(result.toISOString()).toBe('2026-03-28T00:00:00.000Z')
  })
})
