import { vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

let GET: typeof import('@/app/api/countries/[country]/regions/route').GET

function makeCtx(country: string) {
  return { params: Promise.resolve({ country }) }
}

describe('GET /api/countries/[country]/regions', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.stubGlobal('fetch', mockFetch)
    const mod = await import('@/app/api/countries/[country]/regions/route')
    GET = mod.GET
  })

  it('returns 400 for invalid country code', async () => {
    const res = await GET(
      new Request('http://localhost/api/countries/xyz/regions'),
      makeCtx('xyz')
    )
    expect(res.status).toBe(400)
  })

  it('returns regions extracted from holiday data with ISO labels', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { counties: ['DE-BW', 'DE-BY'] },
        { counties: ['DE-BW', 'DE-HE'] },
        { counties: null }, // global holiday
      ]),
    })

    const res = await GET(
      new Request('http://localhost/api/countries/DE/regions'),
      makeCtx('DE')
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(3) // BW, BY, HE
    // Labels come from iso-3166-2 package
    const bw = data.find((r: { code: string }) => r.code === 'BW')
    expect(bw?.name).toBe('Baden-Württemberg')
  })

  it('returns empty array when no regional holidays exist', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { counties: null },
        { counties: null },
      ]),
    })

    const res = await GET(
      new Request('http://localhost/api/countries/AT/regions'),
      makeCtx('AT')
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(0)
  })

  it('returns 500 when external API fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Error' })

    const res = await GET(
      new Request('http://localhost/api/countries/XX/regions'),
      makeCtx('XX')
    )
    expect(res.status).toBe(500)
  })
})
