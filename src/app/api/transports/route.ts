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

  const transports = await prisma.transport.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(transports)
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const maxSortOrder = await prisma.transport.aggregate({
    where: { userId: user.id },
    _max: { sortOrder: true },
  })

  const transport = await prisma.transport.create({
    data: {
      userId: user.id,
      name,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  })

  return NextResponse.json(transport, { status: 201 })
}
