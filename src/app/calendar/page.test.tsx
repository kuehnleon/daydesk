import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor, act } from '@/test/render'
import type { CalendarAttendance } from '@/types'
import Calendar from './page'

vi.mock('@/components/navbar', () => ({ Navbar: () => null }))
vi.mock('@/components/calendar/monthly-summary', () => ({ MonthlySummary: () => null }))
vi.mock('@/components/calendar/calendar-grid', () => ({
  CalendarGrid: ({ isLoadingMonth, attendances }: {
    isLoadingMonth: boolean
    attendances: Record<string, CalendarAttendance>
  }) => <div data-testid="calendar-data">{isLoadingMonth ? 'loading' : Object.keys(attendances).join(',')}</div>,
}))
vi.mock('@/lib/loading', () => ({ minLoadingDelay: () => Promise.resolve() }))

describe('Calendar loading', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'))
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      String(input) === '/api/settings'
        ? Response.json({ country: 'US', defaultState: 'CA' })
        : Response.json([]),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('reloads holidays using the saved country and region', async () => {
    renderWithProviders(<Calendar />)

    await waitFor(() => expect(screen.getByTestId('calendar-data')).not.toHaveTextContent('loading'))
    expect(fetch).toHaveBeenCalledWith(
      '/api/holidays?year=2026&country=US&state=CA',
      { signal: expect.any(AbortSignal) },
    )
  })

  it('shows loading for a new month and ignores an old month response', async () => {
    const user = userEvent.setup()
    let resolveOldRequest!: (response: Response) => void
    vi.mocked(fetch).mockImplementation((input) => {
      if (String(input) === '/api/settings') return Promise.resolve(Response.json({ country: 'DE', defaultState: 'BW' }))
      if (String(input) === '/api/attendance?month=2026-09') {
        return new Promise(resolve => { resolveOldRequest = resolve })
      }
      return Promise.resolve(Response.json([]))
    })
    renderWithProviders(<Calendar />)
    await waitFor(() => expect(screen.getByTestId('calendar-data')).not.toHaveTextContent('loading'))

    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      '/api/attendance?month=2026-09', { signal: expect.any(AbortSignal) },
    ))
    expect(screen.getByTestId('calendar-data')).toHaveTextContent('loading')

    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    await waitFor(() => expect(screen.getByTestId('calendar-data')).not.toHaveTextContent('loading'))
    expect(fetch).toHaveBeenCalledWith('/api/attendance?month=2026-08', { signal: expect.any(AbortSignal) })

    await act(async () => {
      resolveOldRequest(Response.json([{ id: 'old', date: '2026-09-01T00:00:00.000Z', type: 'office' }]))
    })
    expect(screen.getByTestId('calendar-data')).not.toHaveTextContent('2026-09-01')
  })
})
