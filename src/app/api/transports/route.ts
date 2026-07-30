import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTransportSchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'
import logger from '@/lib/logger'

export const GET = withLogging(async () => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/transports' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transports = await prisma.transport.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(transports, {
    headers: { 'Cache-Control': 'private, no-cache' },
  })
})

export const POST = withLogging(async (request) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/transports' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = createTransportSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn({ userId: session.user.id, issues: parsed.error.flatten() }, 'validation failed')
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { name } = parsed.data

  const maxSortOrder = await prisma.transport.aggregate({
    where: { userId: session.user.id },
    _max: { sortOrder: true },
  })

  const transport = await prisma.transport.create({
    data: {
      userId: session.user.id,
      name,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  })

  logger.info({ userId: session.user.id, transportId: transport.id }, 'transport created')
  return NextResponse.json(transport, { status: 201 })
})
