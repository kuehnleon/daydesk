import { NextResponse } from 'next/server'

interface Holiday {
  date: string
  localName: string
  name: string
  countryCode: string
  global: boolean
  counties: string[] | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()
  const stateCode = searchParams.get('state') || 'BW'

  try {
    const response = await fetch(
      `https://date.nager.at/api/v3/publicholidays/${year}/DE`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch holidays')
    }

    const allHolidays: Holiday[] = await response.json()

    // Filter by state (keep global holidays + state-specific)
    const filteredHolidays = allHolidays.filter(holiday => {
      if (holiday.global) return true
      if (holiday.counties && holiday.counties.includes(`DE-${stateCode}`)) {
        return true
      }
      return false
    })

    return NextResponse.json(filteredHolidays)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    )
  }
}
