import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { holidaysQuerySchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'
import { fetchHolidaysFromApi } from '@/lib/holidays'

export const GET = withLogging(async (request) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
  const countryCode = parsed.data.country || 'DE'
  const stateCode = parsed.data.state

  try {
    const allHolidays = await fetchHolidaysFromApi(year, countryCode)

    const filteredHolidays = stateCode
      ? allHolidays.filter(holiday => {
          if (holiday.global) return true
          if (holiday.counties && holiday.counties.includes(`${countryCode}-${stateCode}`)) {
            return true
          }
          return false
        })
      : allHolidays

    return NextResponse.json(filteredHolidays, {
      headers: { 'Cache-Control': 'private, max-age=86400' },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    )
  }
})
