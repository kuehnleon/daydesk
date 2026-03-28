import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
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

  return NextResponse.json({ success: true })
}
