import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders, screen, userEvent, waitFor, act } from '@/test/render'
import Statistics from './page'

vi.mock('@/components/navbar', () => ({ Navbar: () => null }))
vi.mock('@/lib/loading', () => ({ minLoadingDelay: () => Promise.resolve() }))

describe('Statistics date ranges', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'))
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json([]))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('loads the current month and updates the request when the preset changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Statistics />)

    await screen.findByText('No data for this period')
    expect(fetch).toHaveBeenCalledWith(
      '/api/attendance?startDate=2026-10-01&endDate=2026-10-31',
      { signal: expect.any(AbortSignal) },
    )

    await user.selectOptions(screen.getByRole('combobox'), 'last-month')
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/attendance?startDate=2026-09-01&endDate=2026-09-30',
      { signal: expect.any(AbortSignal) },
    ))

    await user.selectOptions(screen.getByRole('combobox'), 'this-year')
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/attendance?startDate=2026-01-01&endDate=2026-12-31',
      { signal: expect.any(AbortSignal) },
    ))
  })

  it('starts a custom range from the selected preset and preserves edited dates', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Statistics />)
    await screen.findByText('No data for this period')

    await user.selectOptions(screen.getByRole('combobox'), 'custom')
    const startInput = screen.getByDisplayValue('2026-10-01')
    expect(screen.getByDisplayValue('2026-10-31')).toBeInTheDocument()
    fireEvent.change(startInput, { target: { value: '2026-10-05' } })

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/attendance?startDate=2026-10-05&endDate=2026-10-31',
      { signal: expect.any(AbortSignal) },
    ))
    expect(startInput).toHaveValue('2026-10-05')
  })

  it('ignores an old range response after the user selects a different period', async () => {
    const user = userEvent.setup()
    let resolveOldRequest!: (response: Response) => void
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { resolveOldRequest = resolve }))
    renderWithProviders(<Statistics />)
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    const oldSignal = vi.mocked(fetch).mock.calls[0][1]!.signal!

    await user.selectOptions(screen.getByRole('combobox'), 'last-month')
    await screen.findByText('No data for this period')
    expect(oldSignal.aborted).toBe(true)

    await act(async () => {
      resolveOldRequest(Response.json([{ id: 'old', type: 'office', locationId: null, transport: null }]))
    })
    expect(screen.getByText('No data for this period')).toBeInTheDocument()
    expect(screen.getByText('(0 days total)')).toBeInTheDocument()
  })
})
