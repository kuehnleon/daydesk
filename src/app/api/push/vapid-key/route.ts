import { NextResponse } from 'next/server'
import { withLogging } from '@/lib/api-utils'

export const GET = withLogging(async () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Push notifications not configured' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { publicKey },
    { headers: { 'Cache-Control': 'public, max-age=86400' } }
  )
})
