import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pushSubscribeSchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'
import logger from '@/lib/logger'

export const POST = withLogging(async (request) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/push/subscribe' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = pushSubscribeSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn({ userId: session.user.id, issues: parsed.error.flatten() }, 'validation failed')
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { endpoint, keys } = parsed.data

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: { userId: session.user.id, endpoint },
    },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  })

  logger.info({ userId: session.user.id }, 'push subscription added')
  return NextResponse.json({ success: true })
})
