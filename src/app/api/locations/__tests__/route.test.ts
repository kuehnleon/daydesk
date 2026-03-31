import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    location: { findMany: vi.fn(), create: vi.fn(), aggregate: vi.fn() },
  },
}))

import { GET, POST } from '@/app/api/locations/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { dummyCtx } from '@/test/helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options)
}

describe('GET /api/locations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(new Request('http://localhost/api/locations'), dummyCtx)
    expect(res.status).toBe(401)
  })

  it('returns locations for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.findMany.mockResolvedValue([{ id: 'loc1', name: 'HQ' }] as never)

    const res = await GET(new Request('http://localhost/api/locations'), dummyCtx)
    expect(res.status).toBe(200)
  })
})

describe('POST /api/locations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for missing name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(makeRequest('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ color: '#ff0000' }),
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid hex color', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(makeRequest('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Office', color: 'red' }),
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('creates location with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } } as never)
    mockPrisma.location.create.mockResolvedValue({ id: 'loc1', name: 'Office' } as never)

    const res = await POST(makeRequest('http://localhost/api/locations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Office', color: '#ff0000', distance: 25 }),
    }), dummyCtx)
    expect(res.status).toBe(201)
  })
})
