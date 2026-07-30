import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { withLogging } from '@/lib/api-utils'
import logger from '@/lib/logger'

export const DELETE = withLogging(async (request, { params }) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/attendance/[id]' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const attendance = await prisma.attendance.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!attendance) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.attendance.delete({
    where: { id },
  })

  logger.info({ userId: session.user.id, attendanceId: id }, 'attendance deleted')
  return NextResponse.json({ success: true })
})
