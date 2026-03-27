import { NextResponse } from 'next/server'
import { holidaysQuerySchema } from '@/lib/validations'

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
const holidayCache = new Map<string, CacheEntry>()

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
  holidayCache.set(year, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  return data
}

export async function GET(request: Request) {
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

    return NextResponse.json(filteredHolidays)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    )
  }
}
