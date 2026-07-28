/**
 * i18n helper — reads project message catalogs so tests reference
 * translation keys instead of hardcoded copy. Keeps tests resilient
 * against copy tweaks that don't change semantics.
 */
import enMessages from '../../messages/en.json'
import deMessages from '../../messages/de.json'

type Locale = 'en' | 'de'
type Messages = Record<string, unknown>

const catalogs: Record<Locale, Messages> = {
  en: enMessages as Messages,
  de: deMessages as Messages,
}

/**
 * Look up a translation by dot-path, e.g. t('nav.dashboard').
 * Throws if the key is missing — that's usually a sign the test is stale.
 */
export function t(key: string, locale: Locale = 'en'): string {
  const parts = key.split('.')
  let node: unknown = catalogs[locale]
  for (const part of parts) {
    if (typeof node !== 'object' || node === null || !(part in (node as Record<string, unknown>))) {
      throw new Error(`i18n key not found: ${key} (${locale})`)
    }
    node = (node as Record<string, unknown>)[part]
  }
  if (typeof node !== 'string') {
    throw new Error(`i18n key ${key} (${locale}) resolved to non-string`)
  }
  return node
}
