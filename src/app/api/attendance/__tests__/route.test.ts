import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    attendance: { findMany: vi.fn(), upsert: vi.fn() },
  },
}))

import { GET, POST } from '@/app/api/attendance/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options)
}

describe('GET /api/attendance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(makeRequest('http://localhost/api/attendance'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when user not found', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    mockPrisma.user.findUnique.mockResolvedValue(null as never)
    const res = await GET(makeRequest('http://localhost/api/attendance'))
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid month format', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    const res = await GET(makeRequest('http://localhost/api/attendance?month=2024'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for startDate without endDate', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    const res = await GET(makeRequest('http://localhost/api/attendance?startDate=2024-01-01'))
    expect(res.status).toBe(400)
  })

  it('returns attendances for valid month', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1', email: 'test@test.com' } as never)
    mockPrisma.attendance.findMany.mockResolvedValue([{ id: 'att1' }] as never)

    const res = await GET(makeRequest('http://localhost/api/attendance?month=2024-01'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })
})

describe('POST /api/attendance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await POST(makeRequest('http://localhost/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ date: '2024-01-15', type: 'office' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing required fields', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    const res = await POST(makeRequest('http://localhost/api/attendance', {
      method: 'POST',
      body: JSON.stringify({}),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid attendance type', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    const res = await POST(makeRequest('http://localhost/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ date: '2024-01-15', type: 'working' }),
    }))
    expect(res.status).toBe(400)
  })

  it('creates attendance with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1', email: 'test@test.com' } as never)
    mockPrisma.attendance.upsert.mockResolvedValue({ id: 'att1', type: 'office' } as never)

    const res = await POST(makeRequest('http://localhost/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ date: '2024-01-15', type: 'office' }),
    }))
    expect(res.status).toBe(200)
  })
})
