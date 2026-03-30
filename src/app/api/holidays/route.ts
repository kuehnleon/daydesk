import { NextResponse } from 'next/server'
import { holidaysQuerySchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'

interface Holiday {
  date: string
  localName: string
  name: string
  countryCode: string
  global: boolean
  counties: string[] | null
}

interface CacheEntry {
  data: Holiday[]
  expiresAt: number
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const CACHE_MAX_SIZE = 10
const holidayCache = new Map<string, CacheEntry>()

function evictExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of holidayCache) {
    if (now >= entry.expiresAt) {
      holidayCache.delete(key)
    }
  }
}

async function fetchHolidaysForYear(year: string): Promise<Holiday[]> {
  const cached = holidayCache.get(year)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data
  }

  const response = await fetch(
    `https://date.nager.at/api/v3/publicholidays/${year}/DE`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch holidays')
  }

  const data: Holiday[] = await response.json()

  evictExpiredEntries()
  if (holidayCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = holidayCache.keys().next().value
    if (oldestKey !== undefined) holidayCache.delete(oldestKey)
  }

  holidayCache.set(year, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  return data
}

export const GET = withLogging(async (request) => {
  const { searchParams } = new URL(request.url)
  const query = Object.fromEntries(searchParams.entries())
  const parsed = holidaysQuerySchema.safeParse(query)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const year = parsed.data.year || new Date().getFullYear().toString()
  const stateCode = parsed.data.state || 'BW'

  try {
    const allHolidays = await fetchHolidaysForYear(year)

    const filteredHolidays = allHolidays.filter(holiday => {
      if (holiday.global) return true
      if (holiday.counties && holiday.counties.includes(`DE-${stateCode}`)) {
        return true
      }
      return false
    })

    return NextResponse.json(filteredHolidays, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    )
  }
})
