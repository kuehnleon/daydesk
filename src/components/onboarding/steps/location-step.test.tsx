import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/render'
import { LocationStep } from './location-step'

describe('LocationStep', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'new-1', name: 'Office Berlin', color: '#3B5BDB' }),
        { status: 201 },
      ),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('adds a new location via POST when the user fills the name + clicks Add', async () => {
    const user = userEvent.setup()
    const setLocations = vi.fn()

    renderWithProviders(
      <LocationStep
        transports={[]}
        locations={[]}
        setLocations={setLocations}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkip={vi.fn()}
      />,
    )

    // The step has multiple inputs; select the "name" one by placeholder.
    const nameInput = screen.getByPlaceholderText(/office munich|büro/i)
    await user.type(nameInput, 'Office Berlin')
    await user.click(screen.getByRole('button', { name: /add location/i }))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/locations')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.name).toBe('Office Berlin')

    await waitFor(() => expect(setLocations).toHaveBeenCalled())
  })

  it('shows an error toast when the name is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <LocationStep
        transports={[]}
        locations={[]}
        setLocations={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkip={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /add location/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/name is required/i)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
