import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withLogging } from '@/lib/api-utils'
import logger from '@/lib/logger'

export const GET = withLogging(async () => {
  const session = await auth()
  if (!session?.user?.id) {
    logger.warn({ path: '/api/push/vapid-key' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Push notifications not configured' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { publicKey },
    { headers: { 'Cache-Control': 'private, max-age=86400' } }
  )
})
