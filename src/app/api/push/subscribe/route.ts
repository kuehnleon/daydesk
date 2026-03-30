import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pushSubscribeSchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'

export const POST = withLogging(async (request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = pushSubscribeSchema.safeParse(body)
  if (!parsed.success) {
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

  return NextResponse.json({ success: true })
})
