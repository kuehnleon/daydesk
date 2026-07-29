import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('renders an animated pulse container that accepts extra classes', () => {
    const { container } = render(<Skeleton className="h-20 w-full" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toMatch(/animate-pulse/)
    expect(el.className).toMatch(/h-20 w-full/)
  })
})
