'use client'

import { useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { useGeneralSettings } from '@/hooks/useGeneralSettings'

interface GeneralSettingsProps {
  onReady?: () => void
}

export function GeneralSettings({ onReady }: GeneralSettingsProps) {
  const {
    country,
    defaultState,
    setDefaultState,
    workDays,
    weekStartDay,
    setWeekStartDay,
    isSaving,
    isMounted,
    isLoaded,
    countries,
    regions,
    isLoadingRegions,
    handleCountryChange,
    saveSettings,
    toggleWorkDay,
    handleLocaleChange,
  } = useGeneralSettings()

  const t = useTranslations('settings')
  const tDays = useTranslations('days')
  const currentLocale = useLocale()
  const onReadyRef = useRef(onReady)
  const calledRef = useRef(false)

  useEffect(() => {
    if (isLoaded && !calledRef.current) {
      calledRef.current = true
      onReadyRef.current?.()
    }
  }, [isLoaded])

  const dayNames = [tDays('monday'), tDays('tuesday'), tDays('wednesday'), tDays('thursday'), tDays('friday'), tDays('saturday'), tDays('sunday')]

  if (!isMounted) return null

  return (
    <div className="space-y-6 card p-4 sm:p-8">
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          {t('language')}
        </label>
        <select
          value={currentLocale}
          onChange={(e) => handleLocaleChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent focus:ring-accent"
        >
          <option value="en">{t('english')}</option>
          <option value="de">{t('german')}</option>
        </select>
        <p className="mt-1 text-xs text-text-tertiary">
          {t('languageHelp')}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          {t('country')}
        </label>
        <select
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent focus:ring-accent"
        >
          {countries.map((c) => (
            <option key={c.countryCode} value={c.countryCode}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-text-tertiary">
          {t('countryHelp')}
        </p>
      </div>

      {(isLoadingRegions || regions.length > 0) && (
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            {t('region')}
          </label>
          {isLoadingRegions ? (
            <Skeleton className="h-10 rounded-lg" />
          ) : (
            <select
              value={defaultState}
              onChange={(e) => setDefaultState(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent focus:ring-accent"
            >
              <option value="">{t('allRegions')}</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-text-tertiary">
            {t('regionHelp')}
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          {t('weekStartsOn')}
        </label>
        <select
          value={weekStartDay}
          onChange={(e) => setWeekStartDay(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent focus:ring-accent"
        >
          <option value={1}>{t('monday')}</option>
          <option value={0}>{t('sunday')}</option>
        </select>
        <p className="mt-1 text-xs text-text-tertiary">
          {t('weekStartHelp')}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          {t('workDays')}
        </label>
        <div className="space-y-2">
          {dayNames.map((name, index) => {
            const dayNumber = index + 1
            const isChecked = workDays.split(',').map(Number).includes(dayNumber)

            return (
              <label key={dayNumber} className="flex items-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleWorkDay(dayNumber)}
                  className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="ml-2 text-sm text-text-secondary">{name}</span>
              </label>
            )
          })}
        </div>
      </div>

      <button
        onClick={saveSettings}
        disabled={isSaving}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isSaving ? t('saving') : t('saveSettings')}
      </button>
    </div>
  )
}
