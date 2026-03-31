import { dateFnsLocales, defaultLocale } from '@/i18n/config'
import type { Locale } from 'date-fns'

export function getDateFnsLocale(locale: string): Locale {
  return dateFnsLocales[locale as keyof typeof dateFnsLocales] || dateFnsLocales[defaultLocale]
}
