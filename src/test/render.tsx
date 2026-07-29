/**
 * Test helper — render a component tree wrapped in the same providers the
 * real app uses (next-intl, ToastProvider, ConfirmProvider). Import this
 * instead of RTL's `render` in component tests.
 */
import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { ToastProvider } from '@/components/ui/toast'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import enMessages from '../../messages/en.json'
import deMessages from '../../messages/de.json'

const messages = { en: enMessages, de: deMessages } as const

interface DaydeskRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: 'en' | 'de'
  /** Skip ToastProvider / ConfirmProvider if the test provides its own. */
  bareProviders?: boolean
}

export function renderWithProviders(
  ui: ReactElement,
  { locale = 'en', bareProviders = false, ...options }: DaydeskRenderOptions = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Europe/Berlin">
      {bareProviders ? children : (
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      )}
    </NextIntlClientProvider>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}

/** Re-export the RTL essentials so tests only import from here. */
export { screen, within, waitFor, act, renderHook, type RenderHookOptions } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

/**
 * Provider wrapper used by both renderWithProviders and renderHook tests.
 * Same shape as the app's real provider tree.
 */
export function DaydeskProviders({ children, locale = 'en' }: { children: ReactNode; locale?: 'en' | 'de' }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Europe/Berlin">
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </NextIntlClientProvider>
  )
}
