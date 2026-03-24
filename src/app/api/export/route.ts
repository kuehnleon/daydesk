import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format, parseISO } from 'date-fns'

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const exportFormat = searchParams.get('format') || 'csv'

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: user.id,
      date: {
        gte: parseISO(startDate),
        lte: parseISO(endDate),
      },
    },
    orderBy: { date: 'asc' },
  })

  if (exportFormat === 'csv') {
    const csv = generateCSV(attendances)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="worklog_${startDate}_${endDate}.csv"`,
      },
    })
  }

  // PDF will be generated client-side for simplicity
  return NextResponse.json(attendances)
}

function generateCSV(attendances: any[]): string {
  const headers = ['Date', 'Type', 'Transport', 'Notes']
  const rows = attendances.map(a => [
    format(new Date(a.date), 'yyyy-MM-dd'),
    a.type,
    a.transport || '',
    a.notes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}
