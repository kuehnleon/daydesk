import { vi } from 'vitest'

// Mock global fetch for the external API call
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { GET } from '@/app/api/holidays/route'
import { dummyCtx } from '@/test/helpers'

function makeRequest(url: string) {
  return new Request(url)
}

describe('GET /api/holidays', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid year', async () => {
    const res = await GET(makeRequest('http://localhost/api/holidays?year=24'), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid country code', async () => {
    const res = await GET(makeRequest('http://localhost/api/holidays?country=xyz'), dummyCtx)
    expect(res.status).toBe(400)
  })

  it('returns holidays for valid params (defaults to DE)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { date: '2024-01-01', localName: 'Neujahr', name: "New Year", countryCode: 'DE', global: true, counties: null },
      ]),
    })

    const res = await GET(makeRequest('http://localhost/api/holidays?year=2024&state=BW'), dummyCtx)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/2024/DE'))
  })

  it('fetches holidays for a non-DE country', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { date: '2024-01-01', localName: 'Neujahrstag', name: "New Year", countryCode: 'AT', global: true, counties: null },
        { date: '2024-08-15', localName: 'Mariä Himmelfahrt', name: "Assumption", countryCode: 'AT', global: true, counties: null },
      ]),
    })

    const res = await GET(makeRequest('http://localhost/api/holidays?year=2024&country=AT'), dummyCtx)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/2024/AT'))
  })

  it('filters by state for non-DE country', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { date: '2024-01-01', localName: 'Neujahr', name: "New Year", countryCode: 'CH', global: true, counties: null },
        { date: '2024-06-29', localName: 'Peter und Paul', name: "Saints Peter and Paul", countryCode: 'CH', global: false, counties: ['CH-TI'] },
      ]),
    })

    const res = await GET(makeRequest('http://localhost/api/holidays?year=2024&country=CH&state=TI'), dummyCtx)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2) // global + CH-TI specific
  })

  it('returns 500 when external API fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' })

    // Use a different year to avoid the in-memory cache from previous test
    const res = await GET(makeRequest('http://localhost/api/holidays?year=2025&state=BW'), dummyCtx)
    expect(res.status).toBe(500)
  })

  it('returns all holidays when no state is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { date: '2026-01-01', localName: 'Neujahr', name: "New Year", countryCode: 'DE', global: true, counties: null },
        { date: '2026-06-19', localName: 'Fronleichnam', name: "Corpus Christi", countryCode: 'DE', global: false, counties: ['DE-BW', 'DE-BY'] },
      ]),
    })

    const res = await GET(makeRequest('http://localhost/api/holidays?year=2026&country=DE'), dummyCtx)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2) // All holidays returned when no state filter
  })
})
