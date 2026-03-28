import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    location: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}))

import { PATCH, DELETE } from '@/app/api/locations/[id]/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options)
}

const params = Promise.resolve({ id: 'loc1' })

describe('PATCH /api/locations/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await PATCH(
      makeRequest('http://localhost/api/locations/loc1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      }),
      { params }
    )
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid color', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await PATCH(
      makeRequest('http://localhost/api/locations/loc1', {
        method: 'PATCH',
        body: JSON.stringify({ color: 'bad' }),
      }),
      { params }
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-owned location', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.findFirst.mockResolvedValue(null as never)

    const res = await PATCH(
      makeRequest('http://localhost/api/locations/loc1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New' }),
      }),
      { params }
    )
    expect(res.status).toBe(404)
  })

  it('updates location with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc1' } as never)
    mockPrisma.location.update.mockResolvedValue({ id: 'loc1', name: 'New' } as never)

    const res = await PATCH(
      makeRequest('http://localhost/api/locations/loc1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New' }),
      }),
      { params }
    )
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/locations/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 for non-owned location', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.findFirst.mockResolvedValue(null as never)

    const res = await DELETE(
      makeRequest('http://localhost/api/locations/loc1', { method: 'DELETE' }),
      { params }
    )
    expect(res.status).toBe(404)
  })

  it('deletes own location', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc1' } as never)
    mockPrisma.location.delete.mockResolvedValue({ id: 'loc1' } as never)

    const res = await DELETE(
      makeRequest('http://localhost/api/locations/loc1', { method: 'DELETE' }),
      { params }
    )
    expect(res.status).toBe(200)
  })
})
