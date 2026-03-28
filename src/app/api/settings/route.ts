import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateSettingsSchema } from '@/lib/validations'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      defaultState: true,
      workDays: true,
      weekStartDay: true,
      reminderEnabled: true,
      reminderTimes: true,
      reminderWorkDaysOnly: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  })
}

export async function PATCH(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = updateSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { defaultState, workDays, weekStartDay, reminderEnabled, reminderTimes, reminderWorkDaysOnly } = parsed.data

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(defaultState && { defaultState }),
      ...(workDays && { workDays }),
      ...(weekStartDay !== undefined && { weekStartDay }),
      ...(reminderEnabled !== undefined && { reminderEnabled }),
      ...(reminderTimes !== undefined && { reminderTimes }),
      ...(reminderWorkDaysOnly !== undefined && { reminderWorkDaysOnly }),
    },
  })

  return NextResponse.json(user)
}
