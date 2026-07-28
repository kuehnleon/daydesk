import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '@/test/render'
import { WelcomeStep } from './welcome-step'

describe('WelcomeStep', () => {
  it('renders welcome copy and both primary + skip buttons', () => {
    renderWithProviders(<WelcomeStep onNext={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /welcome to daydesk/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip setup/i })).toBeInTheDocument()
  })

  it('calls onNext when Get Started is clicked', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    renderWithProviders(<WelcomeStep onNext={onNext} onSkip={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /get started/i }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('calls onSkip when Skip Setup is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    renderWithProviders(<WelcomeStep onNext={vi.fn()} onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: /skip setup/i }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('shows German copy under de locale', () => {
    renderWithProviders(<WelcomeStep onNext={vi.fn()} onSkip={vi.fn()} />, { locale: 'de' })
    // messages/de.json → onboarding.welcome
    expect(screen.getByRole('heading')).toHaveTextContent(/Willkommen/i)
  })
})
