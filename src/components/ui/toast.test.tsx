import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { ToastProvider, useToast } from './toast'

/** Small consumer that fires toasts on button clicks. */
function Consumer() {
  const { showToast } = useToast()
  return (
    <div>
      <button onClick={() => showToast('yay', 'success')}>fire success</button>
      <button onClick={() => showToast('boom', 'error')}>fire error</button>
      <button onClick={() => showToast('hey')}>fire info</button>
    </div>
  )
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws if useToast is used outside a provider', () => {
    // React logs the error to console; silence for cleanliness.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Consumer />)).toThrow(/useToast must be used within a ToastProvider/)
    spy.mockRestore()
  })

  it('renders a success toast when showToast is called', () => {
    render(<ToastProvider><Consumer /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'fire success' }))
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('yay')
  })

  it('uses role="alert" for error toasts', () => {
    render(<ToastProvider><Consumer /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'fire error' }))
    expect(screen.getByRole('alert')).toHaveTextContent('boom')
  })

  it('auto-dismisses after 3 seconds', () => {
    render(<ToastProvider><Consumer /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'fire info' }))
    expect(screen.getByText('hey')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(3001) })
    expect(screen.queryByText('hey')).not.toBeInTheDocument()
  })

  it('dismisses when the close button is clicked', () => {
    render(<ToastProvider><Consumer /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'fire info' }))
    expect(screen.getByText('hey')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close notification' }))
    expect(screen.queryByText('hey')).not.toBeInTheDocument()
  })

  it('supports multiple concurrent toasts', () => {
    render(<ToastProvider><Consumer /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'fire success' }))
    fireEvent.click(screen.getByRole('button', { name: 'fire error' }))
    expect(screen.getByText('yay')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })
})
