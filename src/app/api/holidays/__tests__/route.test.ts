import { vi } from 'vitest'

// Mock global fetch for the external API call
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { GET } from '@/app/api/holidays/route'

function makeRequest(url: string) {
  return new Request(url)
}

describe('GET /api/holidays', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid year', async () => {
    const res = await GET(makeRequest('http://localhost/api/holidays?year=24'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid state', async () => {
    const res = await GET(makeRequest('http://localhost/api/holidays?state=XX'))
    expect(res.status).toBe(400)
  })

  it('returns holidays for valid params', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { date: '2024-01-01', localName: 'Neujahr', name: "New Year", countryCode: 'DE', global: true, counties: null },
      ]),
    })

    const res = await GET(makeRequest('http://localhost/api/holidays?year=2024&state=BW'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })

  it('returns 500 when external API fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' })

    // Use a different year to avoid the in-memory cache from previous test
    const res = await GET(makeRequest('http://localhost/api/holidays?year=2025&state=BW'))
    expect(res.status).toBe(500)
  })
})
