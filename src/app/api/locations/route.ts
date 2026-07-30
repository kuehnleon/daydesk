import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createLocationSchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'
import logger from '@/lib/logger'

export const GET = withLogging(async () => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/locations' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locations = await prisma.location.findMany({
    where: { userId: session.user.id },
    include: { transport: true },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(locations, {
    headers: { 'Cache-Control': 'private, no-cache' },
  })
})

export const POST = withLogging(async (request) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/locations' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = createLocationSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn({ userId: session.user.id, issues: parsed.error.flatten() }, 'validation failed')
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

  logger.info({ userId: session.user.id, locationId: location.id }, 'location created')
  return NextResponse.json(location, { status: 201 })
})
