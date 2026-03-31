import { isHoliday } from '@/lib/holidays'

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
