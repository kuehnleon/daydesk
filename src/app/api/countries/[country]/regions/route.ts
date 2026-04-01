import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withLogging } from '@/lib/api-utils'
import { countryCodeSchema } from '@/lib/validations'
import iso3166 from 'iso-3166-2'

interface Holiday {
  counties: string[] | null
}

interface CacheEntry {
  data: Region[]
  expiresAt: number
}

interface Region {
  code: string
  name: string
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const regionsCache = new Map<string, CacheEntry>()

export const GET = withLogging(async (_request, context) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { country } = await context.params
  const parsed = countryCodeSchema.safeParse(country)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid country code' },
      { status: 400 }
    )
  }

  const countryCode = parsed.data
  const cached = regionsCache.get(countryCode)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'private, max-age=86400' },
    })
  }

  try {
    const year = new Date().getFullYear()
    const response = await fetch(
      `https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`
    )
    if (!response.ok) {
      throw new Error('Failed to fetch holidays')
    }

    const holidays: Holiday[] = await response.json()

    // Extract unique region codes from county data
    const regionCodes = new Set<string>()
    for (const holiday of holidays) {
      if (holiday.counties) {
        for (const county of holiday.counties) {
          // Counties are in format "CC-XX" (e.g., "DE-BW", "CH-TI")
          const parts = county.split('-')
          if (parts.length >= 2) {
            regionCodes.add(parts.slice(1).join('-'))
          }
        }
      }
    }

    // Resolve region names via ISO 3166-2 standard
    const regions: Region[] = Array.from(regionCodes)
      .sort()
      .map(code => {
        const subdivision = iso3166.subdivision(`${countryCode}-${code}`)
        return {
          code,
          name: subdivision?.name || code,
        }
      })

    regionsCache.set(countryCode, { data: regions, expiresAt: Date.now() + CACHE_TTL_MS })

    return NextResponse.json(regions, {
      headers: { 'Cache-Control': 'private, max-age=86400' },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    )
  }
})
