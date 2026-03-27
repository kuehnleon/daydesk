import { isHoliday, GERMAN_STATES } from '@/lib/holidays'

describe('GERMAN_STATES', () => {
  it('has exactly 16 states', () => {
    expect(Object.keys(GERMAN_STATES)).toHaveLength(16)
  })

  it('contains known state codes', () => {
    expect(GERMAN_STATES).toHaveProperty('BW')
    expect(GERMAN_STATES).toHaveProperty('BY')
    expect(GERMAN_STATES).toHaveProperty('BE')
  })

  it('has non-empty values', () => {
    Object.values(GERMAN_STATES).forEach((name) => {
      expect(name.length).toBeGreaterThan(0)
    })
  })
})

describe('isHoliday', () => {
  const holidays = [
    { date: '2024-12-25', localName: 'Weihnachten', name: 'Christmas Day', countryCode: 'DE', global: true, counties: null },
    { date: '2024-01-01', localName: 'Neujahr', name: "New Year's Day", countryCode: 'DE', global: true, counties: null },
  ]

  it('returns true for a holiday date', () => {
    expect(isHoliday(new Date('2024-12-25'), holidays)).toBe(true)
  })

  it('returns false for a non-holiday date', () => {
    expect(isHoliday(new Date('2024-06-15'), holidays)).toBe(false)
  })

  it('returns false for empty holidays array', () => {
    expect(isHoliday(new Date('2024-12-25'), [])).toBe(false)
  })
})
