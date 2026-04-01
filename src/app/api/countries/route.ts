import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withLogging } from '@/lib/api-utils'

interface AvailableCountry {
  countryCode: string
  name: string
}

interface CacheEntry {
  data: AvailableCountry[]
  expiresAt: number
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
let countriesCache: CacheEntry | null = null

export const GET = withLogging(async () => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (countriesCache && Date.now() < countriesCache.expiresAt) {
    return NextResponse.json(countriesCache.data, {
      headers: { 'Cache-Control': 'private, max-age=604800' },
    })
  }

  try {
    const response = await fetch('https://date.nager.at/api/v3/AvailableCountries')
    if (!response.ok) {
      throw new Error('Failed to fetch countries')
    }

    const data: AvailableCountry[] = await response.json()
    const sorted = data.sort((a, b) => a.name.localeCompare(b.name))

    countriesCache = { data: sorted, expiresAt: Date.now() + CACHE_TTL_MS }

    return NextResponse.json(sorted, {
      headers: { 'Cache-Control': 'private, max-age=604800' },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch available countries' },
      { status: 500 }
    )
  }
})
