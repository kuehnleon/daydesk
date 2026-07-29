import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '@/test/render'
import { CardActionModal, type CardTarget } from './card-action-modal'
import type { Location, Transport } from '@/types'

const now = new Date(2026, 6, 15, 12, 0, 0) // 2026-07-15 (fixed date)

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'loc1',
    userId: 'u1',
    name: 'Munich Office',
    transportId: 't-car',
    transport: null,
    distance: 25,
    color: '#3B5BDB',
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeTransports(): Transport[] {
  return [
    { id: 't-car', userId: 'u1', name: 'Car', sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
    { id: 't-bike', userId: 'u1', name: 'Bike', sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  ]
}

describe('CardActionModal', () => {
  it('office target renders transport picker with the location default marked and saves the picked id', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const target: CardTarget = {
      kind: 'location',
      location: makeLocation(),
      transports: makeTransports(),
    }

    renderWithProviders(
      <CardActionModal
        target={target}
        existing={null}
        today={now}
        isLoading={false}
        onSave={onSave}
        onClose={onClose}
      />,
    )

    // Both transports rendered + a "No transport" option.
    expect(screen.getByRole('button', { name: /Car/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bike/ })).toBeInTheDocument()

    // Default badge sits on the Car row (location.transportId = 't-car').
    // The badge text comes from calendar.default = "default".
    const carButton = screen.getByRole('button', { name: /Car/ })
    expect(carButton).toHaveTextContent(/default/i)

    // Pick Bike, then Save.
    await user.click(screen.getByRole('button', { name: /Bike/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith('t-bike', null)
  })

  it('office target: picking "No transport" saves null transportId', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const target: CardTarget = {
      kind: 'location',
      location: makeLocation(),
      transports: makeTransports(),
    }

    renderWithProviders(
      <CardActionModal
        target={target}
        existing={null}
        today={now}
        isLoading={false}
        onSave={onSave}
        onClose={() => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: /No transport/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(null, null)
  })

  it('home target: no transport picker, only notes; save sends null transport + typed note', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    renderWithProviders(
      <CardActionModal
        target={{ kind: 'home' }}
        existing={null}
        today={now}
        isLoading={false}
        onSave={onSave}
        onClose={() => {}}
      />,
    )

    expect(screen.queryByText(/Select transport/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bike/ })).not.toBeInTheDocument()

    const textarea = screen.getByPlaceholderText(/client visit/i)
    await user.type(textarea, 'Focus day')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(null, 'Focus day')
  })

  it('prefills selected transport and notes from existing attendance for same location', () => {
    renderWithProviders(
      <CardActionModal
        target={{
          kind: 'location',
          location: makeLocation(), // default = t-car
          transports: makeTransports(),
        }}
        existing={{
          type: 'office',
          locationId: 'loc1',
          transportId: 't-bike', // override
          notes: 'Prior note',
        }}
        today={now}
        isLoading={false}
        onSave={vi.fn()}
        onClose={() => {}}
      />,
    )

    // Notes prefilled.
    expect(screen.getByDisplayValue('Prior note')).toBeInTheDocument()

    // Bike row is currently selected (ring class), Car row is not.
    const bike = screen.getByRole('button', { name: /Bike/ })
    expect(bike.className).toMatch(/ring-white/)
  })

  it('closes on Escape and via backdrop click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    renderWithProviders(
      <CardActionModal
        target={{ kind: 'sick' }}
        existing={null}
        today={now}
        isLoading={false}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    )

    // Escape.
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    // Backdrop click.
    onClose.mockClear()
    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.parentElement as HTMLElement
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('trims whitespace-only notes to null', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    renderWithProviders(
      <CardActionModal
        target={{ kind: 'off' }}
        existing={null}
        today={now}
        isLoading={false}
        onSave={onSave}
        onClose={() => {}}
      />,
    )

    const textarea = screen.getByPlaceholderText(/client visit/i)
    await user.type(textarea, '   ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(null, null)
  })
})
