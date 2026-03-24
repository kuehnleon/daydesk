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
 * Fetch German public holidays for a given year and state
 * Caches results in memory for 7 days
 */
export async function getHolidays(year: number, stateCode: string): Promise<Holiday[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}${year}_${stateCode}`

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
  const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/DE`)
  if (!response.ok) {
    throw new Error(`Failed to fetch holidays: ${response.statusText}`)
  }

  const allHolidays: Holiday[] = await response.json()

  // Filter by state (keep global holidays + state-specific)
  const filteredHolidays = allHolidays.filter(holiday => {
    if (holiday.global) return true
    if (holiday.counties && holiday.counties.includes(`DE-${stateCode}`)) return true
    return false
  })

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

/**
 * Map of German state codes to full names
 */
export const GERMAN_STATES: Record<string, string> = {
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen',
}
