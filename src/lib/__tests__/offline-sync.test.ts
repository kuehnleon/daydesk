import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/offline-queue', () => ({
  dequeueAll: vi.fn(),
  remove: vi.fn(),
}))

import { syncPendingEntries } from '@/lib/offline-sync'
import { dequeueAll, remove } from '@/lib/offline-queue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDequeueAll = dequeueAll as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRemove = remove as any

describe('syncPendingEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns zeros when queue is empty', async () => {
    mockDequeueAll.mockResolvedValue([])
    const result = await syncPendingEntries()
    expect(result).toEqual({ synced: 0, failed: 0 })
  })

  it('syncs entries and removes them on success', async () => {
    mockDequeueAll.mockResolvedValue([
      { id: 1, date: '2024-01-15', type: 'office', transportId: null, locationId: null, createdAt: Date.now() },
    ])
    mockRemove.mockResolvedValue(undefined)
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))

    const result = await syncPendingEntries()
    expect(result).toEqual({ synced: 1, failed: 0 })
    expect(mockRemove).toHaveBeenCalledWith(1)
  })

  it('removes entries on 400 (bad data)', async () => {
    mockDequeueAll.mockResolvedValue([
      { id: 1, date: 'bad-date', type: 'office', transportId: null, locationId: null, createdAt: Date.now() },
    ])
    mockRemove.mockResolvedValue(undefined)
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: 'bad' }), { status: 400 }))

    const result = await syncPendingEntries()
    expect(result).toEqual({ synced: 0, failed: 1 })
    expect(mockRemove).toHaveBeenCalledWith(1)
  })

  it('leaves entries in queue on network error', async () => {
    mockDequeueAll.mockResolvedValue([
      { id: 1, date: '2024-01-15', type: 'office', transportId: null, locationId: null, createdAt: Date.now() },
    ])
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const result = await syncPendingEntries()
    expect(result).toEqual({ synced: 0, failed: 1 })
    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('leaves entries in queue on server error (500)', async () => {
    mockDequeueAll.mockResolvedValue([
      { id: 1, date: '2024-01-15', type: 'office', transportId: null, locationId: null, createdAt: Date.now() },
    ])
    vi.mocked(fetch).mockResolvedValue(new Response('Server Error', { status: 500 }))

    const result = await syncPendingEntries()
    expect(result).toEqual({ synced: 0, failed: 1 })
    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('handles multiple entries with mixed results', async () => {
    mockDequeueAll.mockResolvedValue([
      { id: 1, date: '2024-01-15', type: 'office', transportId: null, locationId: null, createdAt: Date.now() },
      { id: 2, date: '2024-01-16', type: 'home', transportId: null, locationId: null, createdAt: Date.now() },
    ])
    mockRemove.mockResolvedValue(undefined)
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockRejectedValueOnce(new Error('Network error'))

    const result = await syncPendingEntries()
    expect(result).toEqual({ synced: 1, failed: 1 })
    expect(mockRemove).toHaveBeenCalledTimes(1)
    expect(mockRemove).toHaveBeenCalledWith(1)
  })
})
