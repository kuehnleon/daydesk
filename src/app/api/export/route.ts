import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format, parseISO } from 'date-fns'
import PDFDocument from 'pdfkit'

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
    include: {
      location: { include: { transport: true } },
      transport: true,
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

  if (exportFormat === 'pdf') {
    const pdfBuffer = await generatePDF(attendances, startDate, endDate)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="worklog_${startDate}_${endDate}.pdf"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
}

function generateCSV(attendances: any[]): string {
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

async function generatePDF(attendances: any[], startDate: string, endDate: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('WORKLOG EXPORT', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(12).font('Helvetica').text(`${startDate} to ${endDate}`, { align: 'center' })
    doc.fontSize(10).text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, { align: 'center' })
    doc.moveDown(1.5)

    // Summary statistics
    const stats = {
      office: attendances.filter(a => a.type === 'office').length,
      home: attendances.filter(a => a.type === 'home').length,
      off: attendances.filter(a => a.type === 'off').length,
      sick: attendances.filter(a => a.type === 'sick').length,
      holiday: attendances.filter(a => a.type === 'holiday').length,
      totalDistance: attendances.reduce((sum, a) => sum + (a.location?.distance || 0), 0),
    }

    doc.fontSize(14).font('Helvetica-Bold').text('Summary')
    doc.moveDown(0.5)
    doc.fontSize(10).font('Helvetica')
    doc.text(`Office days: ${stats.office} (${stats.totalDistance} km total commute)`)
    doc.text(`Home office days: ${stats.home}`)
    doc.text(`Days off: ${stats.off}`)
    doc.text(`Sick days: ${stats.sick}`)
    doc.text(`Holidays: ${stats.holiday}`)
    doc.moveDown(1.5)

    // Group attendances by month
    const byMonth = new Map<string, any[]>()
    for (const a of attendances) {
      const monthKey = format(new Date(a.date), 'yyyy-MM')
      if (!byMonth.has(monthKey)) byMonth.set(monthKey, [])
      byMonth.get(monthKey)!.push(a)
    }

    // Table configuration
    const tableLeft = 50
    const colWidths = [70, 60, 100, 80, 60, 110]
    const headers = ['Date', 'Type', 'Location', 'Transport', 'Distance', 'Notes']

    for (const [monthKey, monthData] of byMonth) {
      // Check if we need a new page
      if (doc.y > 680) doc.addPage()

      // Month header
      const monthName = format(parseISO(`${monthKey}-01`), 'MMMM yyyy').toUpperCase()
      doc.fontSize(12).font('Helvetica-Bold').text(monthName)
      doc.moveDown(0.5)

      // Table header
      let x = tableLeft
      doc.fontSize(9).font('Helvetica-Bold')
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x, doc.y, { width: colWidths[i], continued: i < headers.length - 1 })
        x += colWidths[i]
      }
      doc.moveDown(0.3)

      // Draw header line
      doc.moveTo(tableLeft, doc.y).lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), doc.y).stroke()
      doc.moveDown(0.3)

      // Table rows
      doc.font('Helvetica').fontSize(8)
      for (const a of monthData) {
        if (doc.y > 750) {
          doc.addPage()
          // Repeat header on new page
          x = tableLeft
          doc.fontSize(9).font('Helvetica-Bold')
          for (let i = 0; i < headers.length; i++) {
            doc.text(headers[i], x, doc.y, { width: colWidths[i], continued: i < headers.length - 1 })
            x += colWidths[i]
          }
          doc.moveDown(0.3)
          doc.moveTo(tableLeft, doc.y).lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), doc.y).stroke()
          doc.moveDown(0.3)
          doc.font('Helvetica').fontSize(8)
        }

        const row = [
          format(new Date(a.date), 'yyyy-MM-dd'),
          a.type,
          a.location?.name || '-',
          a.transport?.name || a.location?.transport?.name || '-',
          a.location?.distance ? `${a.location.distance} km` : '-',
          a.notes || '',
        ]

        x = tableLeft
        for (let i = 0; i < row.length; i++) {
          const text = row[i].length > 18 ? row[i].substring(0, 15) + '...' : row[i]
          doc.text(text, x, doc.y, { width: colWidths[i], continued: i < row.length - 1 })
          x += colWidths[i]
        }
        doc.moveDown(0.2)
      }

      // Month summary
      const monthDistance = monthData.reduce((sum: number, a: any) => sum + (a.location?.distance || 0), 0)
      const monthOffice = monthData.filter((a: any) => a.type === 'office').length
      doc.moveDown(0.3)
      doc.fontSize(8).font('Helvetica-Oblique')
        .text(`Month total: ${monthOffice} office days, ${monthDistance} km`, tableLeft)
      doc.moveDown(1)
    }

    doc.end()
  })
}
