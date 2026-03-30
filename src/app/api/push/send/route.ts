import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPushNotification } from '@/lib/web-push'
import { getCurrentTimeInTimezone, getDayOfWeekInTimezone, getTodayDateInTimezone } from '@/lib/timezone'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.PUSH_API_SECRET

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Cache current time per timezone to avoid redundant Intl calls
  const timeByTz = new Map<string, string>()
  const getTime = (tz: string) => {
    let t = timeByTz.get(tz)
    if (!t) {
      t = getCurrentTimeInTimezone(now, tz)
      timeByTz.set(tz, t)
    }
    return t
  }

  // Find all reminders whose time matches the current time in their timezone
  const reminders = await prisma.reminderTime.findMany({
    include: {
      user: {
        select: {
          id: true,
          reminderEnabled: true,
          reminderWorkDaysOnly: true,
          workDays: true,
          pushSubscriptions: true,
        },
      },
    },
  })

  let notified = 0
  let errors = 0
  let cleaned = 0
  const notifiedUsers = new Set<string>()

  for (const reminder of reminders) {
    const { user } = reminder

    if (!user.reminderEnabled) continue
    if (notifiedUsers.has(user.id)) continue

    const currentTimeInTz = getTime(reminder.timezone)
    if (currentTimeInTz !== reminder.time) continue

    if (user.pushSubscriptions.length === 0) continue

    if (user.reminderWorkDaysOnly) {
      const dayOfWeek = getDayOfWeekInTimezone(now, reminder.timezone)
      const workDays = user.workDays.split(',').map(Number)
      if (!workDays.includes(dayOfWeek)) continue
    }

    const today = getTodayDateInTimezone(now, reminder.timezone)
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    })
    if (existing) continue

    notifiedUsers.add(user.id)

    const payload = JSON.stringify({
      title: 'daydesk Reminder',
      body: "Don't forget to log your attendance for today!",
      url: '/dashboard',
    })

    for (const sub of user.pushSubscriptions) {
      try {
        await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        notified++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
          cleaned++
        } else {
          errors++
        }
      }
    }
  }

  return NextResponse.json({ notified, errors, cleaned })
}
