import { NextResponse } from 'next/server'
import { format, getDay, startOfDay } from 'date-fns'
import { prisma } from '@/lib/db'
import { sendPushNotification } from '@/lib/web-push'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.PUSH_API_SECRET

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentTime = format(new Date(), 'HH:mm')

  const users = await prisma.user.findMany({
    where: { reminderEnabled: true },
    select: {
      id: true,
      reminderTimes: true,
      reminderWorkDaysOnly: true,
      workDays: true,
      pushSubscriptions: true,
    },
  })

  let notified = 0
  let errors = 0
  let cleaned = 0

  for (const user of users) {
    if (!user.reminderTimes) continue

    const times = user.reminderTimes.split(',')
    if (!times.includes(currentTime)) continue

    if (user.pushSubscriptions.length === 0) continue

    if (user.reminderWorkDaysOnly) {
      const todayDow = getDay(new Date())
      const adjustedDay = todayDow === 0 ? 7 : todayDow
      const workDays = user.workDays.split(',').map(Number)
      if (!workDays.includes(adjustedDay)) continue
    }

    const today = startOfDay(new Date())
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    })
    if (existing) continue

    const payload = JSON.stringify({
      title: 'Daydesk Reminder',
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
