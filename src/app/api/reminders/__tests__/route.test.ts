import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    reminderTime: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { GET, POST } from '@/app/api/reminders/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { dummyCtx } from '@/test/helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any

describe('GET /api/reminders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(new Request('http://localhost/api/reminders'), dummyCtx)
    expect(res.status).toBe(401)
  })

  it('returns list of reminders', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as never)
    mockPrisma.reminderTime.findMany.mockResolvedValue([
      { id: 'r1', time: '09:00', timezone: 'Europe/Berlin' },
      { id: 'r2', time: '14:00', timezone: 'Europe/Berlin' },
    ] as never)

    const res = await GET(new Request('http://localhost/api/reminders'), dummyCtx)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0].time).toBe('09:00')
  })
})

describe('POST /api/reminders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await POST(new Request('http://localhost/api/reminders', {
      method: 'POST',
      body: JSON.stringify({ time: '09:00', timezone: 'Europe/Berlin' }),
    }), dummyCtx)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid time format', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as never)
    const res = await POST(new Request('http://localhost/api/reminders', {
      method: 'POST',
      body: JSON.stringify({ time: '9am', timezone: 'Europe/Berlin' }),
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid timezone', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as never)
    mockPrisma.reminderTime.count.mockResolvedValue(0 as never)
    const res = await POST(new Request('http://localhost/api/reminders', {
      method: 'POST',
      body: JSON.stringify({ time: '09:00', timezone: 'Invalid/Timezone' }),
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('creates a reminder with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as never)
    mockPrisma.reminderTime.count.mockResolvedValue(0 as never)
    mockPrisma.reminderTime.create.mockResolvedValue({
      id: 'r1', time: '09:00', timezone: 'Europe/Berlin',
    } as never)

    const res = await POST(new Request('http://localhost/api/reminders', {
      method: 'POST',
      body: JSON.stringify({ time: '09:00', timezone: 'Europe/Berlin' }),
    }), dummyCtx)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('r1')
  })

  it('returns 400 when max reminders exceeded', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as never)
    mockPrisma.reminderTime.count.mockResolvedValue(10 as never)
    const res = await POST(new Request('http://localhost/api/reminders', {
      method: 'POST',
      body: JSON.stringify({ time: '09:00', timezone: 'Europe/Berlin' }),
    }), dummyCtx)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Maximum')
  })
})
