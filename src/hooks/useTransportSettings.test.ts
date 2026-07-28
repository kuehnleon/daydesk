import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, DaydeskProviders } from '@/test/render'
import { useTransportSettings } from './useTransportSettings'

/**
 * Mock the minLoadingDelay so tests don't wait 300ms per load.
 */
vi.mock('@/lib/loading', () => ({ minLoadingDelay: () => Promise.resolve() }))

describe('useTransportSettings', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify([]), { status: 200 }),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('loads transports on mount', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: '1', name: 'Car' }]), { status: 200 }),
    )
    const { result } = renderHook(() => useTransportSettings(), { wrapper: DaydeskProviders })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.transports).toEqual([{ id: '1', name: 'Car' }])
    expect(fetchSpy).toHaveBeenCalledWith('/api/transports')
  })

  it('save() POSTs a new transport when not editing, then reloads', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ id: '9', name: 'Bike' }), { status: 201 }))
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify([{ id: '9', name: 'Bike' }]), { status: 200 }))

    const { result } = renderHook(() => useTransportSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.openAdd()
      result.current.setForm({ name: 'Bike' })
    })
    await act(async () => { await result.current.save() })

    await waitFor(() => expect(result.current.transports).toEqual([{ id: '9', name: 'Bike' }]))
    // POST call should be the second fetch.
    expect(fetchSpy.mock.calls[1][0]).toBe('/api/transports')
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({ method: 'POST' })
  })

  it('save() PATCHes when editing', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: '5', name: 'Old' }]), { status: 200 }),
    )
    fetchSpy.mockResolvedValueOnce(new Response('{}', { status: 200 })) // PATCH
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: '5', name: 'New' }]), { status: 200 }),
    ) // reload

    const { result } = renderHook(() => useTransportSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.openEdit({ id: '5', name: 'Old' })
      result.current.setForm({ name: 'New' })
    })
    await act(async () => { await result.current.save() })

    expect(fetchSpy.mock.calls[1][0]).toBe('/api/transports/5')
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({ method: 'PATCH' })
  })

  it('save() with empty name shows an error and does not fetch', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
    const { result } = renderHook(() => useTransportSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.openAdd()
      result.current.setForm({ name: '   ' })
    })
    const beforeCalls = fetchSpy.mock.calls.length
    await act(async () => { await result.current.save() })
    expect(fetchSpy.mock.calls.length).toBe(beforeCalls)
  })

  it('reorder() PATCHes sortOrder for every affected row', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
          { id: 'c', name: 'C' },
        ]),
        { status: 200 },
      ),
    )
    // 3 PATCH calls (one per row) — implementation returns a fresh body each time.
    fetchSpy.mockImplementation(async () => new Response('{}', { status: 200 }))

    const { result } = renderHook(() => useTransportSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => { await result.current.reorder('a', 'c') })

    // Order becomes [B, C, A] after moving 'a' to index of 'c'
    expect(result.current.transports.map((t) => t.id)).toEqual(['b', 'c', 'a'])
    // Should have issued 3 PATCH calls with sortOrder 0/1/2
    const patchCalls = fetchSpy.mock.calls.filter(([, init]) => (init as RequestInit)?.method === 'PATCH')
    expect(patchCalls.length).toBe(3)
  })
})
