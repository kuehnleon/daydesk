import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseISO } from 'date-fns'
import { importBatchSchema } from '@/lib/validations'

export async function POST(request: Request) {
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

  const { rows } = parsed.data
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

  // Build upsert operations
  const operations = rows.map(row => {
    const location = row.location ? locationsByName.get(row.location.toLowerCase()) : undefined
    const transport = row.transport ? transportsByName.get(row.transport.toLowerCase()) : undefined

    const locationId = location?.id ?? null
    const transportId = transport?.id ?? location?.transportId ?? null

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
          date: parseISO(row.date),
        },
      },
      update: data,
      create: {
        userId,
        date: parseISO(row.date),
        ...data,
      },
    })
  })

  // Check which dates already exist to count new vs updated
  const dates = rows.map(r => parseISO(r.date))
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

  const updated = rows.filter(r => existingDates.has(parseISO(r.date).toISOString())).length
  const imported = rows.length - updated

  await prisma.$transaction(operations)

  return NextResponse.json({ imported, updated }, { status: 200 })
}
