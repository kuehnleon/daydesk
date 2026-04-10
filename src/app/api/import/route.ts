import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { importBatchSchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'

const COLOR_OPTIONS = [
  '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16', '#6366F1',
]

export const POST = withLogging(async (request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = importBatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { rows, mappings } = parsed.data
  const userId = session.user.id

  // Fetch user's locations and transports for name resolution
  const [locations, transports] = await Promise.all([
    prisma.location.findMany({ where: { userId }, include: { transport: true } }),
    prisma.transport.findMany({ where: { userId } }),
  ])

  const locationsByName = new Map(
    locations.map(l => [l.name.toLowerCase(), l])
  )
  const transportsByName = new Map(
    transports.map(t => [t.name.toLowerCase(), t])
  )

  // Process mappings: create new entries and build redirect maps
  const locationRedirects = new Map<string, string | null>()
  const transportRedirects = new Map<string, string | null>()

  if (mappings) {
    // Process transports first (locations may reference them)
    for (const m of mappings.transports) {
      const nameLower = m.csvName.toLowerCase()
      if (m.action === 'create') {
        const maxSort = await prisma.transport.aggregate({
          where: { userId }, _max: { sortOrder: true },
        })
        const newTransport = await prisma.transport.create({
          data: {
            userId,
            name: m.csvName,
            sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
          },
        })
        transportsByName.set(nameLower, newTransport)
        transportRedirects.set(nameLower, newTransport.id)
      } else if (m.action === 'map' && m.existingId) {
        transportRedirects.set(nameLower, m.existingId)
      } else {
        transportRedirects.set(nameLower, null)
      }
    }

    // Process locations
    let colorIndex = locations.length % COLOR_OPTIONS.length
    for (const m of mappings.locations) {
      const nameLower = m.csvName.toLowerCase()
      if (m.action === 'create') {
        const maxSort = await prisma.location.aggregate({
          where: { userId }, _max: { sortOrder: true },
        })
        const newLocation = await prisma.location.create({
          data: {
            userId,
            name: m.csvName,
            color: COLOR_OPTIONS[colorIndex % COLOR_OPTIONS.length],
            sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
          },
          include: { transport: true },
        })
        colorIndex++
        locationsByName.set(nameLower, newLocation)
        locationRedirects.set(nameLower, newLocation.id)
      } else if (m.action === 'map' && m.existingId) {
        locationRedirects.set(nameLower, m.existingId)
      } else {
        locationRedirects.set(nameLower, null)
      }
    }
  }

  // Build upsert operations with redirect-aware name resolution
  const operations = rows.map(row => {
    let locationId: string | null = null
    let transportId: string | null = null

    if (row.location) {
      const nameLower = row.location.toLowerCase()
      if (locationRedirects.has(nameLower)) {
        locationId = locationRedirects.get(nameLower) ?? null
      } else {
        locationId = locationsByName.get(nameLower)?.id ?? null
      }
    }

    if (row.transport) {
      const nameLower = row.transport.toLowerCase()
      if (transportRedirects.has(nameLower)) {
        transportId = transportRedirects.get(nameLower) ?? null
      } else {
        transportId = transportsByName.get(nameLower)?.id ?? null
      }
    }

    // Fallback: if location matched but no transport, use location's default
    if (locationId && !transportId && !row.transport) {
      const loc = row.location ? locationsByName.get(row.location.toLowerCase()) : undefined
      if (loc?.transportId) {
        transportId = loc.transportId
      }
    }

    const data = {
      type: row.type,
      transportId,
      locationId,
      notes: row.notes || null,
    }

    return prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date(row.date),
        },
      },
      update: data,
      create: {
        userId,
        date: new Date(row.date),
        ...data,
      },
    })
  })

  // Check which dates already exist to count new vs updated
  const dates = rows.map(r => new Date(r.date))
  const existing = await prisma.attendance.findMany({
    where: {
      userId,
      date: { in: dates },
    },
    select: { date: true },
  })
  const existingDates = new Set(
    existing.map(e => e.date.toISOString())
  )

  const updated = rows.filter(r => existingDates.has(new Date(r.date).toISOString())).length
  const imported = rows.length - updated

  await prisma.$transaction(operations)

  return NextResponse.json({ imported, updated }, { status: 200 })
})
