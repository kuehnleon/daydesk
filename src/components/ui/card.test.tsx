import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

describe('Card composition', () => {
  it('renders the whole composition with children and forwarded classNames', () => {
    render(
      <Card className="c-outer" data-testid="card">
        <CardHeader className="c-head">
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )
    const card = screen.getByTestId('card')
    expect(card.className).toMatch(/rounded-xl/)
    expect(card.className).toMatch(/c-outer/)
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Desc')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('forwards refs on each sub-component', () => {
    let cardRef: HTMLDivElement | null = null
    let titleRef: HTMLDivElement | null = null
    render(
      <Card ref={(el) => { cardRef = el }}>
        <CardTitle ref={(el) => { titleRef = el }}>t</CardTitle>
      </Card>,
    )
    expect(cardRef).toBeInstanceOf(HTMLDivElement)
    expect(titleRef).toBeInstanceOf(HTMLDivElement)
  })
})
