import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const locations = await prisma.location.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(locations)
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, transport, distance, color } = body

  if (!name || !color) {
    return NextResponse.json({ error: 'Name and color are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get max sortOrder for this user
  const maxSortOrder = await prisma.location.aggregate({
    where: { userId: user.id },
    _max: { sortOrder: true },
  })

  const location = await prisma.location.create({
    data: {
      userId: user.id,
      name,
      transport: transport || null,
      distance: distance ? parseInt(distance) : null,
      color,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  })

  return NextResponse.json(location)
}
