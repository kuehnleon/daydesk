import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // YYYY-MM format
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

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
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(attendances)
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { date, type, transport, notes } = body

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
      transport,
      notes,
    },
    create: {
      userId: user.id,
      date: new Date(date),
      type,
      transport,
      notes,
    },
  })

  return NextResponse.json(attendance)
}
