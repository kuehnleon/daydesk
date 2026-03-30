import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withLogging } from '@/lib/api-utils'

export const GET = withLogging(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch {
    return NextResponse.json({ status: 'error', message: 'Database unreachable' }, { status: 503 })
  }
})
