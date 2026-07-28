import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/render'
import { TransportStep } from './transport-step'

describe('TransportStep', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'new-1', name: 'Bike' }), { status: 201 }),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('adds a new transport via POST when the user types + clicks Add', async () => {
    const user = userEvent.setup()
    const setTransports = vi.fn()

    renderWithProviders(
      <TransportStep
        transports={[]}
        setTransports={setTransports}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkip={vi.fn()}
      />,
    )

    await user.type(screen.getByRole('textbox'), 'Bike')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/transports')
    expect(init).toMatchObject({ method: 'POST' })
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ name: 'Bike' })

    await waitFor(() =>
      expect(setTransports).toHaveBeenCalledWith([{ id: 'new-1', name: 'Bike' }]),
    )
  })

  it('shows an error toast when the name is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <TransportStep
        transports={[]}
        setTransports={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkip={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add' }))
    // Error toast from useToast
    expect(await screen.findByRole('alert')).toHaveTextContent(/name is required/i)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('calls onNext when Next is clicked and no unsaved input exists', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    renderWithProviders(
      <TransportStep
        transports={[{ id: '1', name: 'Bike' }]}
        setTransports={vi.fn()}
        onNext={onNext}
        onBack={vi.fn()}
        onSkip={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('renders the empty state when no transports exist', () => {
    renderWithProviders(
      <TransportStep
        transports={[]}
        setTransports={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkip={vi.fn()}
      />,
    )
    // messages/en.json → onboarding.noTransportsYet
    expect(screen.getByText(/no transport methods added/i)).toBeInTheDocument()
  })
})
