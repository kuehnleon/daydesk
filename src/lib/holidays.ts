interface Holiday {
  date: string
  localName: string
  name: string
  countryCode: string
  global: boolean
  counties: string[] | null
}

const CACHE_KEY_PREFIX = 'holidays_'
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CachedData {
  data: Holiday[]
  timestamp: number
}

/**
 * Fetch public holidays for a given year, country, and optional state/region
 * Caches results in localStorage for 7 days
 */
export async function getHolidays(year: number, countryCode: string, stateCode?: string): Promise<Holiday[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}${countryCode}_${year}_${stateCode || 'all'}`

  // Check cache
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, timestamp }: CachedData = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION_MS) {
        return data
      }
    }
  }

  // Fetch from Nager.Date API
  const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch holidays: ${response.statusText}`)
  }

  const allHolidays: Holiday[] = await response.json()

  // Filter by state/region if provided (keep global holidays + region-specific)
  const filteredHolidays = stateCode
    ? allHolidays.filter(holiday => {
        if (holiday.global) return true
        if (holiday.counties && holiday.counties.includes(`${countryCode}-${stateCode}`)) return true
        return false
      })
    : allHolidays

  // Cache results
  if (typeof window !== 'undefined') {
    const cacheData: CachedData = {
      data: filteredHolidays,
      timestamp: Date.now()
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  }

  return filteredHolidays
}

/**
 * Check if a date is a public holiday
 */
export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return holidays.some(h => h.date === dateStr)
}
