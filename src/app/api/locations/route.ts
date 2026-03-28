import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createLocationSchema } from '@/lib/validations'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locations = await prisma.location.findMany({
    where: { userId: session.user.id },
    include: { transport: true },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(locations, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  })
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = createLocationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { name, transportId, distance, color } = parsed.data

  const maxSortOrder = await prisma.location.aggregate({
    where: { userId: session.user.id },
    _max: { sortOrder: true },
  })

  const location = await prisma.location.create({
    data: {
      userId: session.user.id,
      name,
      transportId: transportId || null,
      distance: distance ?? null,
      color,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
    include: { transport: true },
  })

  return NextResponse.json(location, { status: 201 })
}
