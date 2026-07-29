import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/render'
import { CompleteStep } from './complete-step'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('CompleteStep', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    pushMock.mockClear()
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('shows the with-transports summary', () => {
    renderWithProviders(<CompleteStep transportCount={2} locationCount={3} />)
    // "Your workspace is ready with 3 locations and 2 transport methods."
    expect(screen.getByText(/3 locations/i)).toBeInTheDocument()
    expect(screen.getByText(/2 transport methods/i)).toBeInTheDocument()
  })

  it('shows the no-transports summary when transportCount === 0', () => {
    renderWithProviders(<CompleteStep transportCount={0} locationCount={1} />)
    expect(screen.getByText(/1 location/i)).toBeInTheDocument()
    // No "transport" text should appear on the no-transports variant.
    expect(screen.queryByText(/transport/i)).not.toBeInTheDocument()
  })

  it('on finish, PATCHes /api/settings and navigates to /dashboard', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CompleteStep transportCount={1} locationCount={1} />)

    await user.click(screen.getByRole('button', { name: /go to dashboard/i }))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/settings')
    expect(init).toMatchObject({ method: 'PATCH' })
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ onboardingCompleted: true })

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard'))
  })

  it('disables the button while the request is in flight', async () => {
    // Never-resolving fetch to hold the button in the disabled state.
    fetchSpy.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    renderWithProviders(<CompleteStep transportCount={1} locationCount={1} />)
    const btn = screen.getByRole('button', { name: /go to dashboard/i })
    await user.click(btn)
    expect(btn).toBeDisabled()
  })
})
