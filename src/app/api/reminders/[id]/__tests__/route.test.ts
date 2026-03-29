import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    reminderTime: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { DELETE } from '@/app/api/reminders/[id]/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

function makeDeleteRequest(id: string) {
  return [
    new Request(`http://localhost/api/reminders/${id}`, { method: 'DELETE' }),
    { params: Promise.resolve({ id }) },
  ] as const
}

describe('DELETE /api/reminders/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const [req, ctx] = makeDeleteRequest('r1')
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(401)
  })

  it('returns 404 when reminder not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as never)
    mockPrisma.reminderTime.findUnique.mockResolvedValue(null as never)
    const [req, ctx] = makeDeleteRequest('nonexistent')
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(404)
  })

  it('returns 404 when reminder belongs to another user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as never)
    mockPrisma.reminderTime.findUnique.mockResolvedValue({ id: 'r1', userId: 'user2' } as never)
    const [req, ctx] = makeDeleteRequest('r1')
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(404)
  })

  it('deletes owned reminder', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as never)
    mockPrisma.reminderTime.findUnique.mockResolvedValue({ id: 'r1', userId: 'user1' } as never)
    mockPrisma.reminderTime.delete.mockResolvedValue(undefined as never)
    const [req, ctx] = makeDeleteRequest('r1')
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(200)
    expect(mockPrisma.reminderTime.delete).toHaveBeenCalledWith({ where: { id: 'r1' } })
  })
})
