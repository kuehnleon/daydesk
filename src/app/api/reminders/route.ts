import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createReminderTimeSchema } from '@/lib/validations'
import { isValidTimezone } from '@/lib/timezone'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reminders = await prisma.reminderTime.findMany({
    where: { userId: session.user.id },
    select: { id: true, time: true, timezone: true },
    orderBy: { time: 'asc' },
  })

  return NextResponse.json(reminders)
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createReminderTimeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { time, timezone } = parsed.data

  if (!isValidTimezone(timezone)) {
    return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
  }

  const count = await prisma.reminderTime.count({
    where: { userId: session.user.id },
  })
  if (count >= 10) {
    return NextResponse.json({ error: 'Maximum 10 reminders allowed' }, { status: 400 })
  }

  const reminder = await prisma.reminderTime.create({
    data: { userId: session.user.id, time, timezone },
    select: { id: true, time: true, timezone: true },
  })

  return NextResponse.json(reminder, { status: 201 })
}
