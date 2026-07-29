import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider, useConfirm } from './confirm-dialog'

interface Captured {
  result: boolean | null
}

function Consumer({ opts, onResult }: {
  opts: Parameters<ReturnType<typeof useConfirm>['confirm']>[0]
  onResult: (r: boolean) => void
}) {
  const { confirm } = useConfirm()
  return (
    <button
      onClick={async () => {
        const r = await confirm(opts)
        onResult(r)
      }}
    >
      trigger
    </button>
  )
}

function renderWithConfirm(
  opts: Parameters<ReturnType<typeof useConfirm>['confirm']>[0],
) {
  const captured: Captured = { result: null }
  render(
    <ConfirmProvider>
      <Consumer opts={opts} onResult={(r) => { captured.result = r }} />
    </ConfirmProvider>,
  )
  return captured
}

describe('ConfirmProvider', () => {
  it('renders dialog with title + message and resolves true on confirm', async () => {
    const user = userEvent.setup()
    const captured = renderWithConfirm({
      title: 'Delete?',
      message: 'Are you sure?',
      confirmLabel: 'Yes',
      cancelLabel: 'No',
    })

    await user.click(screen.getByRole('button', { name: 'trigger' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent('Delete?')
    expect(dialog).toHaveTextContent('Are you sure?')

    await user.click(screen.getByRole('button', { name: 'Yes' }))
    expect(captured.result).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('resolves false when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const captured = renderWithConfirm({ message: 'delete?' })
    await user.click(screen.getByRole('button', { name: 'trigger' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(captured.result).toBe(false)
  })

  it('resolves false when Escape is pressed', async () => {
    const user = userEvent.setup()
    const captured = renderWithConfirm({ message: 'delete?' })
    await user.click(screen.getByRole('button', { name: 'trigger' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(captured.result).toBe(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('applies destructive styling to the confirm button', async () => {
    const user = userEvent.setup()
    renderWithConfirm({ message: 'destroy?', destructive: true, confirmLabel: 'Destroy' })
    await user.click(screen.getByRole('button', { name: 'trigger' }))
    const btn = await screen.findByRole('button', { name: 'Destroy' })
    expect(btn.className).toMatch(/bg-red-600/)
  })

  it('resolves false when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const captured = renderWithConfirm({ message: 'delete?' })
    await user.click(screen.getByRole('button', { name: 'trigger' }))
    const dialog = await screen.findByRole('dialog')
    // Click the backdrop — the direct parent of the dialog role.
    const backdrop = dialog.parentElement!
    await user.click(backdrop)
    expect(captured.result).toBe(false)
  })

  it('throws when useConfirm is used outside its provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<Consumer opts={{ message: 'x' }} onResult={() => {}} />),
    ).toThrow(/useConfirm must be used within a ConfirmProvider/)
    spy.mockRestore()
  })
})

import { vi } from 'vitest'
