import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('excludes falsy values', () => {
    expect(cn('base', false && 'hidden')).toBe('base')
  })

  it('handles tailwind merge (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})
