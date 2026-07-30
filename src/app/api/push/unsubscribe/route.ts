import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pushUnsubscribeSchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'
import logger from '@/lib/logger'

export const POST = withLogging(async (request) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/push/unsubscribe' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = pushUnsubscribeSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn({ userId: session.user.id, issues: parsed.error.flatten() }, 'validation failed')
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: session.user.id,
      endpoint: parsed.data.endpoint,
    },
  })

  logger.info({ userId: session.user.id }, 'push subscription removed')
  return NextResponse.json({ success: true })
})
