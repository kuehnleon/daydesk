import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    transport: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}))

import { PATCH, DELETE } from '@/app/api/transports/[id]/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options)
}

const params = Promise.resolve({ id: 't1' })

describe('PATCH /api/transports/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await PATCH(
      makeRequest('http://localhost/api/transports/t1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Bus' }),
      }),
      { params }
    )
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid sortOrder', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    const res = await PATCH(
      makeRequest('http://localhost/api/transports/t1', {
        method: 'PATCH',
        body: JSON.stringify({ sortOrder: -1 }),
      }),
      { params }
    )
    expect(res.status).toBe(400)
  })

  it('updates transport with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' } as never)
    mockPrisma.transport.findFirst.mockResolvedValue({ id: 't1' } as never)
    mockPrisma.transport.update.mockResolvedValue({ id: 't1', name: 'Bus' } as never)

    const res = await PATCH(
      makeRequest('http://localhost/api/transports/t1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Bus' }),
      }),
      { params }
    )
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/transports/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 for non-owned transport', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' } as never)
    mockPrisma.transport.findFirst.mockResolvedValue(null as never)

    const res = await DELETE(
      makeRequest('http://localhost/api/transports/t1', { method: 'DELETE' }),
      { params }
    )
    expect(res.status).toBe(404)
  })

  it('deletes own transport', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } } as never)
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' } as never)
    mockPrisma.transport.findFirst.mockResolvedValue({ id: 't1' } as never)
    mockPrisma.transport.delete.mockResolvedValue({ id: 't1' } as never)

    const res = await DELETE(
      makeRequest('http://localhost/api/transports/t1', { method: 'DELETE' }),
      { params }
    )
    expect(res.status).toBe(200)
  })
})
