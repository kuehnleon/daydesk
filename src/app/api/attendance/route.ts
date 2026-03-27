import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { getAttendanceQuerySchema, createAttendanceSchema } from '@/lib/validations'

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = Object.fromEntries(searchParams.entries())
  const parsed = getAttendanceQuerySchema.safeParse(query)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { month, startDate, endDate } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let dateFilter = {}
  if (month) {
    const date = parseISO(`${month}-01`)
    dateFilter = {
      date: {
        gte: startOfMonth(date),
        lte: endOfMonth(date),
      },
    }
  } else if (startDate && endDate) {
    dateFilter = {
      date: {
        gte: parseISO(startDate),
        lte: parseISO(endDate),
      },
    }
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: user.id,
      ...dateFilter,
    },
    include: {
      location: { include: { transport: true } },
      transport: true,
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(attendances)
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = createAttendanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { date, type, transportId, locationId, notes } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const attendance = await prisma.attendance.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: new Date(date),
      },
    },
    update: {
      type,
      transportId: transportId || null,
      locationId: locationId || null,
      notes,
    },
    create: {
      userId: user.id,
      date: new Date(date),
      type,
      transportId: transportId || null,
      locationId: locationId || null,
      notes,
    },
    include: {
      location: { include: { transport: true } },
      transport: true,
    },
  })

  return NextResponse.json(attendance)
}
