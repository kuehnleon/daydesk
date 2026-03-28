import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    transport: { findMany: vi.fn(), create: vi.fn(), aggregate: vi.fn() },
  },
}))

import { GET, POST } from '@/app/api/transports/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options)
}

describe('GET /api/transports', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns transports for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.transport.findMany.mockResolvedValue([{ id: 't1', name: 'Car' }] as never)

    const res = await GET()
    expect(res.status).toBe(200)
  })
})

describe('POST /api/transports', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for empty name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(makeRequest('http://localhost/api/transports', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(makeRequest('http://localhost/api/transports', {
      method: 'POST',
      body: JSON.stringify({}),
    }))
    expect(res.status).toBe(400)
  })

  it('creates transport with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.transport.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } } as never)
    mockPrisma.transport.create.mockResolvedValue({ id: 't1', name: 'Car' } as never)

    const res = await POST(makeRequest('http://localhost/api/transports', {
      method: 'POST',
      body: JSON.stringify({ name: 'Car' }),
    }))
    expect(res.status).toBe(201)
  })
})
