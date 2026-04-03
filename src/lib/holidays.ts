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

// --- Server-side holiday fetching with in-memory cache ---

interface ServerCacheEntry {
  data: Holiday[]
  expiresAt: number
}

const SERVER_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const SERVER_CACHE_MAX_SIZE = 50
const serverHolidayCache = new Map<string, ServerCacheEntry>()

function evictExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of serverHolidayCache) {
    if (now >= entry.expiresAt) {
      serverHolidayCache.delete(key)
    }
  }
}

/**
 * Fetch public holidays from Nager.Date API with server-side in-memory caching.
 * Intended for use in API routes / server-side code (no localStorage).
 */
export async function fetchHolidaysFromApi(year: string, countryCode: string): Promise<Holiday[]> {
  const cacheKey = `${countryCode}_${year}`
  const cached = serverHolidayCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data
  }

  const response = await fetch(
    `https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch holidays')
  }

  const data: Holiday[] = await response.json()

  evictExpiredEntries()
  if (serverHolidayCache.size >= SERVER_CACHE_MAX_SIZE) {
    const oldestKey = serverHolidayCache.keys().next().value
    if (oldestKey !== undefined) serverHolidayCache.delete(oldestKey)
  }

  serverHolidayCache.set(cacheKey, { data, expiresAt: Date.now() + SERVER_CACHE_TTL_MS })
  return data
}

/**
 * Check if a given date (YYYY-MM-DD) is a public holiday for a country/state.
 * Fetches and caches holiday data server-side.
 */
export async function isDateHoliday(
  dateStr: string,
  countryCode: string,
  stateCode?: string | null
): Promise<boolean> {
  const year = dateStr.slice(0, 4)
  const allHolidays = await fetchHolidaysFromApi(year, countryCode)

  const holidays = stateCode
    ? allHolidays.filter(h => h.global || (h.counties && h.counties.includes(`${countryCode}-${stateCode}`)))
    : allHolidays

  return holidays.some(h => h.date === dateStr)
}
