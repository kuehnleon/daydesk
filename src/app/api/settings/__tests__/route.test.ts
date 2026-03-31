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
import { dummyCtx } from '@/test/helpers'

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
    const res = await GET(new Request('http://localhost/api/settings'), dummyCtx)
    expect(res.status).toBe(401)
  })

  it('returns user settings including country and reminders', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user1',
      email: 'test@test.com',
      country: 'DE',
      defaultState: 'BW',
      workDays: '1,2,3,4,5',
      weekStartDay: 1,
      reminderEnabled: false,
      reminderWorkDaysOnly: true,
      reminders: [{ id: 'r1', time: '09:00', timezone: 'Europe/Berlin' }],
    } as never)

    const res = await GET(new Request('http://localhost/api/settings'), dummyCtx)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.country).toBe('DE')
    expect(data.reminderEnabled).toBe(false)
    expect(data.reminders).toEqual([{ id: 'r1', time: '09:00', timezone: 'Europe/Berlin' }])
    expect(data.reminderWorkDaysOnly).toBe(true)
  })
})

describe('PATCH /api/settings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for invalid country code', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ country: 'invalid' }),
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid workDays', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ workDays: 'abc' }),
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('returns 400 for weekStartDay out of range', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ weekStartDay: 7 }),
    }), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('updates settings with valid country and state', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.user.update.mockResolvedValue({
      id: 'user1',
      country: 'AT',
      defaultState: '',
    } as never)

    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ country: 'AT', defaultState: '' }),
    }), dummyCtx)
    expect(res.status).toBe(200)
  })

  it('updates settings with valid German state', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.user.update.mockResolvedValue({
      id: 'user1',
      country: 'DE',
      defaultState: 'BY',
    } as never)

    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ country: 'DE', defaultState: 'BY' }),
    }), dummyCtx)
    expect(res.status).toBe(200)
  })

  it('updates reminder toggle settings', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', email: 'test@test.com' } } as never)
    mockPrisma.user.update.mockResolvedValue({
      id: 'user1',
      reminderEnabled: true,
      reminderWorkDaysOnly: true,
    } as never)

    const res = await PATCH(makeRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ reminderEnabled: true, reminderWorkDaysOnly: true }),
    }), dummyCtx)
    expect(res.status).toBe(200)
  })
})
