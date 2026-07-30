import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createReminderTimeSchema } from '@/lib/validations'
import { isValidTimezone } from '@/lib/timezone'
import { withLogging } from '@/lib/api-utils'
import logger from '@/lib/logger'

export const GET = withLogging(async () => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/reminders' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reminders = await prisma.reminderTime.findMany({
    where: { userId: session.user.id },
    select: { id: true, time: true, timezone: true },
    orderBy: { time: 'asc' },
  })

  return NextResponse.json(reminders)
})

export const POST = withLogging(async (request) => {
  const session = await auth()

  if (!session?.user?.id) {
    logger.warn({ path: '/api/reminders' }, 'unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createReminderTimeSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn({ userId: session.user.id, issues: parsed.error.flatten() }, 'validation failed')
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { time, timezone } = parsed.data

  if (!isValidTimezone(timezone)) {
    logger.warn({ userId: session.user.id, timezone }, 'validation failed')
    return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
  }

  const count = await prisma.reminderTime.count({
    where: { userId: session.user.id },
  })
  if (count >= 10) {
    logger.warn({ userId: session.user.id, count }, 'validation failed')
    return NextResponse.json({ error: 'Maximum 10 reminders allowed' }, { status: 400 })
  }

  const reminder = await prisma.reminderTime.create({
    data: { userId: session.user.id, time, timezone },
    select: { id: true, time: true, timezone: true },
  })

  logger.info({ userId: session.user.id, reminderId: reminder.id, time, timezone }, 'reminder created')
  return NextResponse.json(reminder, { status: 201 })
})
