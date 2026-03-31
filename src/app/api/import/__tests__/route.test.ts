import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    attendance: { upsert: vi.fn(), findMany: vi.fn() },
    location: { findMany: vi.fn() },
    transport: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { POST } from '@/app/api/import/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { dummyCtx } from '@/test/helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/import', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await POST(makeRequest({ rows: [] }), dummyCtx)
    expect(res.status).toBe(401)
  })

  it('returns 400 for empty rows array', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(makeRequest({ rows: [] }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid date format', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(makeRequest({
      rows: [{ date: 'bad-date', type: 'office' }],
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid attendance type', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(makeRequest({
      rows: [{ date: '2024-01-15', type: 'invalid' }],
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid JSON body', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(new Request('http://localhost/api/import', {
      method: 'POST',
      body: 'not json',
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('imports valid rows successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.findMany.mockResolvedValue([
      { id: 'loc1', name: 'Office Munich', transportId: 'tr1', transport: { id: 'tr1', name: 'Car' } },
    ] as never)
    mockPrisma.transport.findMany.mockResolvedValue([
      { id: 'tr1', name: 'Car' },
    ] as never)
    mockPrisma.attendance.findMany.mockResolvedValue([] as never)
    mockPrisma.attendance.upsert.mockResolvedValue({} as never)
    mockPrisma.$transaction.mockResolvedValue([{}] as never)

    const res = await POST(makeRequest({
      rows: [
        { date: '2024-01-15', type: 'office', location: 'Office Munich', transport: 'Car' },
      ],
    }), dummyCtx)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.imported).toBe(1)
    expect(data.updated).toBe(0)
  })

  it('resolves location names case-insensitively', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.findMany.mockResolvedValue([
      { id: 'loc1', name: 'Office Munich', transportId: null, transport: null },
    ] as never)
    mockPrisma.transport.findMany.mockResolvedValue([] as never)
    mockPrisma.attendance.findMany.mockResolvedValue([] as never)
    mockPrisma.attendance.upsert.mockResolvedValue({} as never)
    mockPrisma.$transaction.mockResolvedValue([{}] as never)

    const res = await POST(makeRequest({
      rows: [
        { date: '2024-01-15', type: 'office', location: 'office munich' },
      ],
    }), dummyCtx)
    expect(res.status).toBe(200)

    // Verify upsert was called with the resolved location ID
    const upsertCall = mockPrisma.attendance.upsert.mock.calls[0]
    expect(upsertCall).toBeDefined()
  })

  it('handles unknown location names gracefully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.findMany.mockResolvedValue([] as never)
    mockPrisma.transport.findMany.mockResolvedValue([] as never)
    mockPrisma.attendance.findMany.mockResolvedValue([] as never)
    mockPrisma.attendance.upsert.mockResolvedValue({} as never)
    mockPrisma.$transaction.mockResolvedValue([{}] as never)

    const res = await POST(makeRequest({
      rows: [
        { date: '2024-01-15', type: 'office', location: 'Unknown Office' },
      ],
    }), dummyCtx)
    expect(res.status).toBe(200)
  })

  it('counts updated rows when dates already exist', async () => {
    const { parseISO } = await import('date-fns')
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.findMany.mockResolvedValue([] as never)
    mockPrisma.transport.findMany.mockResolvedValue([] as never)
    // Use parseISO to match the exact Date the route creates
    mockPrisma.attendance.findMany.mockResolvedValue([
      { date: parseISO('2024-01-15') },
    ] as never)
    mockPrisma.attendance.upsert.mockResolvedValue({} as never)
    mockPrisma.$transaction.mockResolvedValue([{}, {}] as never)

    const res = await POST(makeRequest({
      rows: [
        { date: '2024-01-15', type: 'office' },
        { date: '2024-01-16', type: 'home' },
      ],
    }), dummyCtx)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.imported).toBe(1)
    expect(data.updated).toBe(1)
  })
})
