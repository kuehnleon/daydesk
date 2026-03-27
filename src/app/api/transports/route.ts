import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTransportSchema } from '@/lib/validations'

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

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = createTransportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { name } = parsed.data

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
