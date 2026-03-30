import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { withLogging } from '@/lib/api-utils'

export const DELETE = withLogging(async (_request, { params }) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const reminder = await prisma.reminderTime.findUnique({ where: { id } })
  if (!reminder || reminder.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.reminderTime.delete({ where: { id } })

  return NextResponse.json({ success: true })
})
