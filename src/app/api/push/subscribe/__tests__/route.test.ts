import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    pushSubscription: { upsert: vi.fn() },
  },
}))

import { POST } from '@/app/api/push/subscribe/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/push/subscribe', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await POST(makeRequest({ endpoint: 'https://push.example.com/sub1', keys: { p256dh: 'key1', auth: 'auth1' } }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(makeRequest({ endpoint: 'not-a-url' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing keys', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await POST(makeRequest({ endpoint: 'https://push.example.com/sub1' }))
    expect(res.status).toBe(400)
  })

  it('upserts subscription with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.pushSubscription.upsert.mockResolvedValue({ id: 'sub1' } as never)

    const res = await POST(makeRequest({
      endpoint: 'https://push.example.com/sub1',
      keys: { p256dh: 'key1', auth: 'auth1' },
    }))
    expect(res.status).toBe(200)
    expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_endpoint: { userId: 'user1', endpoint: 'https://push.example.com/sub1' } },
      })
    )
  })
})
