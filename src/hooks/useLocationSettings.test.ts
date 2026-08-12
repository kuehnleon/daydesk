import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, DaydeskProviders } from '@/test/render'
import { useLocationSettings } from './useLocationSettings'

vi.mock('@/lib/loading', () => ({ minLoadingDelay: () => Promise.resolve() }))

describe('useLocationSettings', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Return a fresh Response per call (bodies are single-use in happy-dom/undici).
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify([]), { status: 200 }),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('loads locations + transports on mount in parallel', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 'l1', name: 'Office', color: '#3B5BDB' }]), { status: 200 }),
    )
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 't1', name: 'Bike' }]), { status: 200 }),
    )

    const { result } = renderHook(() => useLocationSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.locations).toEqual([{ id: 'l1', name: 'Office', color: '#3B5BDB' }])
    expect(result.current.transports).toEqual([{ id: 't1', name: 'Bike' }])
    // First two calls should be /api/locations and /api/transports.
    const urls = fetchSpy.mock.calls.slice(0, 2).map(([u]: [RequestInfo | URL, RequestInit | undefined]) => u)
    expect(urls).toEqual(expect.arrayContaining(['/api/locations', '/api/transports']))
  })

  it('save() POSTs a new location when not editing', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'new', name: 'Berlin', color: '#3B5BDB' }), { status: 201 }),
    )
    // Any subsequent reload calls — fresh Response per call.
    fetchSpy.mockImplementation(async () => new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => useLocationSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.openAdd()
      result.current.setForm({ ...result.current.form, name: 'Berlin' })
    })
    await act(async () => { await result.current.save() })

    const postCall = fetchSpy.mock.calls.find(
      ([url, init]: [RequestInfo | URL, RequestInit | undefined]) =>
        url === '/api/locations' && init?.method === 'POST',
    )
    expect(postCall).toBeDefined()
    expect(JSON.parse((postCall![1] as RequestInit).body as string).name).toBe('Berlin')
  })

  it('save() with empty name shows error toast (no POST)', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => useLocationSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.openAdd()
      result.current.setForm({ ...result.current.form, name: '   ' })
    })
    const before = fetchSpy.mock.calls.length
    await act(async () => { await result.current.save() })
    // No new fetch calls issued.
    expect(fetchSpy.mock.calls.length).toBe(before)
  })
})
