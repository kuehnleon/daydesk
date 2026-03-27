import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    attendance: { findMany: vi.fn() },
  },
}))

// Mock jspdf to avoid DOM dependencies in tests
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    output: vi.fn().mockReturnValue(new ArrayBuffer(8)),
    internal: { pageSize: { width: 210 } },
  })),
}))

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}))

import { GET } from '@/app/api/export/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeRequest(url: string) {
  return new Request(url)
}

describe('GET /api/export', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(makeRequest('http://localhost/api/export?startDate=2024-01-01&endDate=2024-12-31'))
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing startDate', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    const res = await GET(makeRequest('http://localhost/api/export?endDate=2024-12-31'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid format', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    const res = await GET(makeRequest('http://localhost/api/export?startDate=2024-01-01&endDate=2024-12-31&format=xlsx'))
    expect(res.status).toBe(400)
  })

  it('exports CSV with valid params', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' } as never)
    mockPrisma.attendance.findMany.mockResolvedValue([
      {
        id: 'att1',
        date: new Date('2024-01-15'),
        type: 'office',
        location: { name: 'HQ', distance: 25, transport: { name: 'Car' } },
        transport: null,
        notes: null,
      },
    ] as never)

    const res = await GET(makeRequest('http://localhost/api/export?startDate=2024-01-01&endDate=2024-12-31'))
    expect(res.headers.get('Content-Type')).toBe('text/csv')
  })
})
