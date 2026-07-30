import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateTransportSchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'
import logger from '@/lib/logger'

export const PATCH = withLogging(async (request, { params }) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/transports/[id]' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = updateTransportSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn({ userId: session.user.id, issues: parsed.error.flatten() }, 'validation failed')
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { name, sortOrder } = parsed.data

  const existing = await prisma.transport.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Transport not found' }, { status: 404 })
  }

  const transport = await prisma.transport.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  })

  logger.info({ userId: session.user.id, transportId: id }, 'transport updated')
  return NextResponse.json(transport)
})

export const DELETE = withLogging(async (request, { params }) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/transports/[id]' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.transport.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Transport not found' }, { status: 404 })
  }

  await prisma.transport.delete({
    where: { id },
  })

  logger.info({ userId: session.user.id, transportId: id }, 'transport deleted')
  return NextResponse.json({ success: true })
})
