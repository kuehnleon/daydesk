import { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen, userEvent, act } from '@/test/render'
import { CountryStep } from './country-step'

function CountryHarness() {
  const [country, setCountry] = useState('DE')
  const [defaultState, setDefaultState] = useState('BW')
  return <CountryStep
    country={country}
    defaultState={defaultState}
    setCountry={setCountry}
    setDefaultState={setDefaultState}
    onNext={() => {}}
    onBack={() => {}}
    onSkip={() => {}}
  />
}

describe('CountryStep region loading', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input) === '/api/countries') {
        return Response.json([
          { countryCode: 'DE', name: 'Germany' },
          { countryCode: 'US', name: 'United States' },
        ])
      }
      return Response.json([{ code: 'NY', name: 'New York' }])
    })
  })

  afterEach(() => vi.restoreAllMocks())

  it('fetches the country list once and only one region request per country change', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CountryHarness />)
    await screen.findByRole('option', { name: 'United States' })
    await screen.findByRole('option', { name: 'New York' })

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'US')
    await screen.findByRole('option', { name: 'New York' })
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => url)
    expect(urls.filter(url => url === '/api/countries')).toHaveLength(1)
    expect(urls.filter(url => url === '/api/countries/US/regions')).toHaveLength(1)
    expect(screen.getAllByRole('combobox')[1]).toHaveValue('')
  })

  it('ignores regions from a previously selected country', async () => {
    const user = userEvent.setup()
    let resolveOldRegions!: (response: Response) => void
    const fallback = vi.mocked(fetch).getMockImplementation()!
    vi.mocked(fetch).mockImplementation((input, init) => {
      if (String(input) === '/api/countries/DE/regions') {
        return new Promise(resolve => { resolveOldRegions = resolve })
      }
      return fallback(input, init)
    })
    renderWithProviders(<CountryHarness />)
    await screen.findByRole('option', { name: 'United States' })
    await user.selectOptions(screen.getByRole('combobox'), 'US')
    await screen.findByRole('option', { name: 'New York' })

    await act(async () => {
      resolveOldRegions(Response.json([{ code: 'BW', name: 'Baden-Württemberg' }]))
    })
    expect(screen.queryByRole('option', { name: 'Baden-Württemberg' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'New York' })).toBeInTheDocument()
  })
})
