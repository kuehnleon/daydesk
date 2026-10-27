import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { act, renderHook } from '@/test/render'
import { useHydrated } from './useHydrated'

function HydrationStatus() {
  return <span>{useHydrated() ? 'client' : 'server'}</span>
}

describe('useHydrated', () => {
  it('returns true for client-only rendering', () => {
    const { result } = renderHook(() => useHydrated())
    expect(result.current).toBe(true)
  })

  it('matches server HTML during hydration before exposing browser-only values', async () => {
    const html = renderToString(<HydrationStatus />)
    expect(html).toBe('<span>server</span>')

    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)
    const onRecoverableError = vi.fn()
    let root: ReturnType<typeof hydrateRoot>

    await act(async () => {
      root = hydrateRoot(container, <HydrationStatus />, { onRecoverableError })
    })

    try {
      expect(container.textContent).toBe('client')
      expect(onRecoverableError).not.toHaveBeenCalled()
    } finally {
      act(() => root.unmount())
      container.remove()
    }
  })
})
