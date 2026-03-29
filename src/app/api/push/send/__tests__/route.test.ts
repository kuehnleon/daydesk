import { vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    reminderTime: { findMany: vi.fn() },
    attendance: { findUnique: vi.fn() },
    pushSubscription: { delete: vi.fn() },
  },
}))

vi.mock('@/lib/web-push', () => ({
  sendPushNotification: vi.fn(),
}))

vi.mock('@/lib/timezone', () => ({
  getCurrentTimeInTimezone: vi.fn(),
  getDayOfWeekInTimezone: vi.fn(),
  getTodayDateInTimezone: vi.fn(),
}))

import { POST } from '@/app/api/push/send/route'
import { prisma } from '@/lib/db'
import { sendPushNotification } from '@/lib/web-push'
import { getCurrentTimeInTimezone, getDayOfWeekInTimezone, getTodayDateInTimezone } from '@/lib/timezone'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSendPush = sendPushNotification as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetCurrentTime = getCurrentTimeInTimezone as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetDayOfWeek = getDayOfWeekInTimezone as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetTodayDate = getTodayDateInTimezone as any

const PUSH_API_SECRET = 'test-secret'

function makeRequest(token?: string) {
  return new Request('http://localhost/api/push/send', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

describe('POST /api/push/send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PUSH_API_SECRET = PUSH_API_SECRET
    mockGetCurrentTime.mockReturnValue('09:00')
    mockGetDayOfWeek.mockReturnValue(1)
    mockGetTodayDate.mockReturnValue(new Date('2026-03-28T00:00:00.000Z'))
  })

  afterEach(() => {
    delete process.env.PUSH_API_SECRET
  })

  it('returns 401 without authorization', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong token', async () => {
    const res = await POST(makeRequest('wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('sends push to users with matching reminder time in their timezone', async () => {
    mockPrisma.reminderTime.findMany.mockResolvedValue([
      {
        id: 'rt1',
        userId: 'user1',
        time: '09:00',
        timezone: 'Europe/Berlin',
        user: {
          id: 'user1',
          reminderEnabled: true,
          reminderWorkDaysOnly: false,
          workDays: '1,2,3,4,5',
          pushSubscriptions: [
            { id: 'sub1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
          ],
        },
      },
    ] as never)

    mockPrisma.attendance.findUnique.mockResolvedValue(null as never)
    mockSendPush.mockResolvedValue(undefined as never)

    const res = await POST(makeRequest(PUSH_API_SECRET))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.notified).toBe(1)
    expect(mockSendPush).toHaveBeenCalledTimes(1)
  })

  it('skips reminders where time does not match', async () => {
    mockGetCurrentTime.mockReturnValue('10:00')

    mockPrisma.reminderTime.findMany.mockResolvedValue([
      {
        id: 'rt1',
        userId: 'user1',
        time: '09:00',
        timezone: 'Europe/Berlin',
        user: {
          id: 'user1',
          reminderEnabled: true,
          reminderWorkDaysOnly: false,
          workDays: '1,2,3,4,5',
          pushSubscriptions: [
            { id: 'sub1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
          ],
        },
      },
    ] as never)

    const res = await POST(makeRequest(PUSH_API_SECRET))
    const data = await res.json()
    expect(data.notified).toBe(0)
    expect(mockSendPush).not.toHaveBeenCalled()
  })

  it('skips users with attendance already logged', async () => {
    mockPrisma.reminderTime.findMany.mockResolvedValue([
      {
        id: 'rt1',
        userId: 'user1',
        time: '09:00',
        timezone: 'Europe/Berlin',
        user: {
          id: 'user1',
          reminderEnabled: true,
          reminderWorkDaysOnly: false,
          workDays: '1,2,3,4,5',
          pushSubscriptions: [
            { id: 'sub1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
          ],
        },
      },
    ] as never)

    mockPrisma.attendance.findUnique.mockResolvedValue({ id: 'att1' } as never)

    const res = await POST(makeRequest(PUSH_API_SECRET))
    const data = await res.json()
    expect(data.notified).toBe(0)
    expect(mockSendPush).not.toHaveBeenCalled()
  })

  it('deduplicates users with multiple matching reminders', async () => {
    mockPrisma.reminderTime.findMany.mockResolvedValue([
      {
        id: 'rt1',
        userId: 'user1',
        time: '09:00',
        timezone: 'Europe/Berlin',
        user: {
          id: 'user1',
          reminderEnabled: true,
          reminderWorkDaysOnly: false,
          workDays: '1,2,3,4,5',
          pushSubscriptions: [
            { id: 'sub1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
          ],
        },
      },
      {
        id: 'rt2',
        userId: 'user1',
        time: '09:00',
        timezone: 'America/New_York',
        user: {
          id: 'user1',
          reminderEnabled: true,
          reminderWorkDaysOnly: false,
          workDays: '1,2,3,4,5',
          pushSubscriptions: [
            { id: 'sub1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
          ],
        },
      },
    ] as never)

    mockPrisma.attendance.findUnique.mockResolvedValue(null as never)
    mockSendPush.mockResolvedValue(undefined as never)

    const res = await POST(makeRequest(PUSH_API_SECRET))
    const data = await res.json()
    // Should only notify once despite two matching reminders
    expect(data.notified).toBe(1)
  })

  it('cleans up expired subscriptions on 410', async () => {
    mockPrisma.reminderTime.findMany.mockResolvedValue([
      {
        id: 'rt1',
        userId: 'user1',
        time: '09:00',
        timezone: 'Europe/Berlin',
        user: {
          id: 'user1',
          reminderEnabled: true,
          reminderWorkDaysOnly: false,
          workDays: '1,2,3,4,5',
          pushSubscriptions: [
            { id: 'sub1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
          ],
        },
      },
    ] as never)

    mockPrisma.attendance.findUnique.mockResolvedValue(null as never)
    mockSendPush.mockRejectedValue({ statusCode: 410 } as never)
    mockPrisma.pushSubscription.delete.mockResolvedValue(undefined as never)

    const res = await POST(makeRequest(PUSH_API_SECRET))
    const data = await res.json()
    expect(data.cleaned).toBe(1)
    expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({ where: { id: 'sub1' } })
  })
})
