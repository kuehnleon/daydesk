import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, DaydeskProviders } from '@/test/render'
import { useGeneralSettings } from './useGeneralSettings'

/**
 * Stub /api/settings, /api/countries, and the regions endpoint.
 */
function stubBoot(opts: {
  settings?: Record<string, unknown>
  countries?: Array<{ code: string; name: string }>
  regions?: Array<{ code: string; name: string }>
} = {}) {
  const settings = { country: 'DE', defaultState: 'BW', workDays: '1,2,3,4,5', weekStartDay: 1, ...opts.settings }
  const countries = opts.countries ?? [{ code: 'DE', name: 'Germany' }]
  const regions = opts.regions ?? [{ code: 'BW', name: 'Baden-Württemberg' }]

  const spy = vi.spyOn(globalThis, 'fetch')
  // The hook fires loadSettings + loadCountries in parallel; loadSettings then chains loadRegions.
  spy.mockImplementation(async (input: Request | string | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url === '/api/settings') return new Response(JSON.stringify(settings), { status: 200 })
    if (url === '/api/countries') return new Response(JSON.stringify(countries), { status: 200 })
    if (url.startsWith('/api/countries/') && url.endsWith('/regions')) {
      return new Response(JSON.stringify(regions), { status: 200 })
    }
    return new Response('', { status: 404 })
  })
  return spy
}

describe('useGeneralSettings', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = stubBoot()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('loads settings + countries + regions on mount', async () => {
    const { result } = renderHook(() => useGeneralSettings(), { wrapper: DaydeskProviders })

    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(result.current.country).toBe('DE')
    expect(result.current.defaultState).toBe('BW')
    expect(result.current.countries).toEqual([{ code: 'DE', name: 'Germany' }])
    expect(result.current.regions).toEqual([{ code: 'BW', name: 'Baden-Württemberg' }])
  })

  it('handleCountryChange fetches regions for the new country and clears defaultState', async () => {
    const { result } = renderHook(() => useGeneralSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    // Change country to US — our stub returns the same regions payload for any country.
    await act(async () => { result.current.handleCountryChange('US') })

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith('/api/countries/US/regions'),
    )
    expect(result.current.country).toBe('US')
    expect(result.current.defaultState).toBe('')
  })

  it('saveSettings PATCHes /api/settings with the current form values', async () => {
    fetchSpy.mockResolvedValueOnce = undefined as never // unused
    const { result } = renderHook(() => useGeneralSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    await act(async () => { await result.current.saveSettings() })

    const patchCall = fetchSpy.mock.calls.find(
      ([url, init]) => url === '/api/settings' && (init as RequestInit)?.method === 'PATCH',
    )
    expect(patchCall).toBeDefined()
    const body = JSON.parse((patchCall![1] as RequestInit).body as string)
    expect(body).toMatchObject({ country: 'DE', defaultState: 'BW', workDays: '1,2,3,4,5', weekStartDay: 1 })
  })

  it('toggleWorkDay adds/removes a day and keeps sorted order', async () => {
    const { result } = renderHook(() => useGeneralSettings(), { wrapper: DaydeskProviders })
    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    // Starts with 1,2,3,4,5. Add 6 (saturday).
    act(() => { result.current.toggleWorkDay(6) })
    expect(result.current.workDays).toBe('1,2,3,4,5,6')

    // Remove 3.
    act(() => { result.current.toggleWorkDay(3) })
    expect(result.current.workDays).toBe('1,2,4,5,6')
  })
})
