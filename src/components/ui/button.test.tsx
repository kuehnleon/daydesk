import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with default variant + size classes', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: 'Click me' })
    // default variant → bg-primary; default size → h-9
    expect(btn.className).toMatch(/bg-primary/)
    expect(btn.className).toMatch(/h-9/)
  })

  it('applies destructive variant styling', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button', { name: 'Delete' }).className).toMatch(/bg-destructive/)
  })

  it('applies size="sm" styling', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button', { name: 'Small' }).className).toMatch(/h-8/)
  })

  it('merges custom className with variant classes', () => {
    render(<Button className="custom-x">X</Button>)
    const btn = screen.getByRole('button', { name: 'X' })
    expect(btn.className).toMatch(/custom-x/)
    expect(btn.className).toMatch(/bg-primary/)
  })

  it('respects disabled prop', () => {
    render(<Button disabled>Off</Button>)
    expect(screen.getByRole('button', { name: 'Off' })).toBeDisabled()
  })

  it('forwards ref to the underlying <button>', () => {
    let captured: HTMLButtonElement | null = null
    render(<Button ref={(el) => { captured = el }}>Ref</Button>)
    expect(captured).toBeInstanceOf(HTMLButtonElement)
  })
})
