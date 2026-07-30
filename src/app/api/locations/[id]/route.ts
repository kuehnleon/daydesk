import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateLocationSchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'
import logger from '@/lib/logger'

export const PATCH = withLogging(async (request, { params }) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/locations/[id]' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = updateLocationSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn({ userId: session.user.id, issues: parsed.error.flatten() }, 'validation failed')
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { name, transportId, distance, color, sortOrder } = parsed.data

  // Verify location belongs to user
  const existing = await prisma.location.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  }

  const location = await prisma.location.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(transportId !== undefined && { transportId: transportId || null }),
      ...(distance !== undefined && { distance: distance ?? null }),
      ...(color !== undefined && { color }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
    include: { transport: true },
  })

  logger.info({ userId: session.user.id, locationId: id }, 'location updated')
  return NextResponse.json(location)
})

export const DELETE = withLogging(async (request, { params }) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/locations/[id]' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify location belongs to user
  const existing = await prisma.location.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  }

  await prisma.location.delete({
    where: { id },
  })

  logger.info({ userId: session.user.id, locationId: id }, 'location deleted')
  return NextResponse.json({ success: true })
})
