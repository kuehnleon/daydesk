import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

import { GET, PATCH } from '@/app/api/settings/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options)
}

describe('GET /api/settings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns user settings', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user1',
      email: 'test@test.com',
      defaultState: 'BW',
      workDays: '1,2,3,4,5',
      weekStartDay: 1,
    } as never)

    const res = await GET()
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/settings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for invalid state code', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ defaultState: 'XX' }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid workDays', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ workDays: 'abc' }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for weekStartDay out of range', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ weekStartDay: 7 }),
    }))
    expect(res.status).toBe(400)
  })

  it('updates settings with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.user.update.mockResolvedValue({
      id: 'user1',
      defaultState: 'BY',
    } as never)

    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ defaultState: 'BY' }),
    }))
    expect(res.status).toBe(200)
  })
})
