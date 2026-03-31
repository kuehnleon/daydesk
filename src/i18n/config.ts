import { enUS, de } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'

export const locales = ['en', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const dateFnsLocales: Record<Locale, DateFnsLocale> = {
  en: enUS,
  de: de,
}
