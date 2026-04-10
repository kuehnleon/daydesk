import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AttendanceWithRelations } from '@/types'
import { exportQuerySchema } from '@/lib/validations'
import { withLogging } from '@/lib/api-utils'

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number }
}

export const GET = withLogging(async (request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = Object.fromEntries(searchParams.entries())
  const parsed = exportQuerySchema.safeParse(query)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { startDate, endDate, format: exportFormat } = parsed.data

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      location: { include: { transport: true } },
      transport: true,
    },
    orderBy: { date: 'asc' },
    take: 3660,
  })

  if (exportFormat === 'csv') {
    const csv = generateCSV(attendances)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="daydesk_${startDate}_${endDate}.csv"`,
      },
    })
  }

  if (exportFormat === 'pdf') {
    const pdfBuffer = await generatePDF(attendances, startDate, endDate)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="daydesk_${startDate}_${endDate}.pdf"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
})

function generateCSV(attendances: AttendanceWithRelations[]): string {
  const headers = ['Date', 'Type', 'Location', 'Transport', 'Distance (km)', 'Notes']
  const rows = attendances.map(a => [
    format(new Date(a.date), 'yyyy-MM-dd'),
    a.type,
    a.location?.name || '',
    a.transport?.name || a.location?.transport?.name || '',
    a.location?.distance?.toString() || '',
    a.notes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

async function generatePDF(attendances: AttendanceWithRelations[], startDate: string, endDate: string): Promise<Buffer> {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('daydesk export', doc.internal.pageSize.width / 2, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${startDate} to ${endDate}`, doc.internal.pageSize.width / 2, 28, { align: 'center' })

  doc.setFontSize(10)
  doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, doc.internal.pageSize.width / 2, 35, { align: 'center' })

  // Summary statistics
  const stats = {
    office: attendances.filter(a => a.type === 'office').length,
    home: attendances.filter(a => a.type === 'home').length,
    off: attendances.filter(a => a.type === 'off').length,
    sick: attendances.filter(a => a.type === 'sick').length,
    holiday: attendances.filter(a => a.type === 'holiday').length,
    totalDistance: attendances.reduce((sum, a) => sum + (a.location?.distance || 0), 0),
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 14, 50)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const summaryLines = [
    `Office days: ${stats.office} (${stats.totalDistance} km total commute)`,
    `Home office days: ${stats.home}`,
    `Days off: ${stats.off}`,
    `Sick days: ${stats.sick}`,
    `Holidays: ${stats.holiday}`,
  ]
  summaryLines.forEach((line, i) => {
    doc.text(line, 14, 58 + (i * 6))
  })

  // Group attendances by month
  const byMonth = new Map<string, AttendanceWithRelations[]>()
  for (const a of attendances) {
    const monthKey = format(new Date(a.date), 'yyyy-MM')
    if (!byMonth.has(monthKey)) byMonth.set(monthKey, [])
    byMonth.get(monthKey)!.push(a)
  }

  let yPos = 95
  const headers = ['Date', 'Type', 'Location', 'Transport', 'Distance', 'Notes']

  for (const [monthKey, monthData] of byMonth) {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Month header
    const monthName = format(new Date(`${monthKey}-01`), 'MMMM yyyy').toUpperCase()
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(monthName, 14, yPos)
    yPos += 5

    // Table data
    const tableData = monthData.map(a => [
      format(new Date(a.date), 'yyyy-MM-dd'),
      a.type,
      a.location?.name || '-',
      a.transport?.name || a.location?.transport?.name || '-',
      a.location?.distance ? `${a.location.distance} km` : '-',
      (a.notes || '').substring(0, 20),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 },
        5: { cellWidth: 40 },
      },
      margin: { left: 14, right: 14 },
    })

    // Month summary
    const monthDistance = monthData.reduce((sum: number, a) => sum + (a.location?.distance || 0), 0)
    const monthOffice = monthData.filter((a) => a.type === 'office').length

    // Get the final Y position after the table
    yPos = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(`Month total: ${monthOffice} office days, ${monthDistance} km`, 14, yPos)
    yPos += 15
  }

  // Convert to buffer
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
