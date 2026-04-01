import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'test-user' } }),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Re-import the module for each test to reset module-level cache
let GET: typeof import('@/app/api/countries/route').GET

describe('GET /api/countries', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset module to clear the in-memory cache
    vi.resetModules()
    vi.stubGlobal('fetch', mockFetch)
    const mod = await import('@/app/api/countries/route')
    GET = mod.GET
  })

  it('returns sorted list of countries', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { countryCode: 'DE', name: 'Germany' },
        { countryCode: 'AT', name: 'Austria' },
        { countryCode: 'CH', name: 'Switzerland' },
      ]),
    })

    const res = await GET(new Request('http://localhost/api/countries'), { params: Promise.resolve({}) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(3)
    expect(data[0].name).toBe('Austria') // sorted alphabetically
  })

  it('returns 500 when external API fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Error' })

    const res = await GET(new Request('http://localhost/api/countries'), { params: Promise.resolve({}) })
    expect(res.status).toBe(500)
  })
})
