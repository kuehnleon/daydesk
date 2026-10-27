import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen, userEvent, act, waitFor } from '@/test/render'
import ExportImport from './page'

vi.mock('@/components/navbar', () => ({ Navbar: () => null }))

function csvFile(location: string) {
  return new File([
    `Date,Type,Location,Transport,Distance (km),Notes\n2026-10-01,office,${location},,,`,
  ], `${location}.csv`, { type: 'text/csv' })
}

describe('CSV name mapping', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json([]))
  })

  afterEach(() => vi.restoreAllMocks())

  it('clears mappings when a subsequent file has no valid rows', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(<ExportImport />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    await user.upload(input, csvFile('Berlin'))
    await screen.findByRole('combobox')

    await user.upload(input, new File(['Invalid header\ninvalid row'], 'invalid.csv', { type: 'text/csv' }))
    await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it('ignores a pending entity lookup after the import is cleared and replaced', async () => {
    const user = userEvent.setup()
    let resolveOldLocations!: (response: Response) => void
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { resolveOldLocations = resolve }))
    const { container } = renderWithProviders(<ExportImport />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!

    await user.upload(input, csvFile('Berlin'))
    await screen.findByRole('button', { name: 'Clear' })
    expect(screen.getByRole('button', { name: /import 1 row/i })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Clear' }))

    await user.upload(input, csvFile('Munich'))
    await screen.findByRole('combobox')
    await act(async () => { resolveOldLocations(Response.json([])) })

    expect(screen.queryByText('Berlin')).not.toBeInTheDocument()
    expect(screen.getAllByText('Munich')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /import 1 row/i })).toBeEnabled()
  })
})
