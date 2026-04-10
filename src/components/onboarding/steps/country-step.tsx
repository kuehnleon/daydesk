'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { MapPin, Loader2 } from 'lucide-react'
import type { AvailableCountry, Region } from '@/types'

interface CountryStepProps {
  country: string
  defaultState: string
  setCountry: (country: string) => void
  setDefaultState: (state: string) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function CountryStep({
  country,
  defaultState,
  setCountry,
  setDefaultState,
  onNext,
  onBack,
  onSkip,
}: CountryStepProps) {
  const t = useTranslations('onboarding')
  const { showToast } = useToast()
  const [countries, setCountries] = useState<AvailableCountry[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(true)
  const [isLoadingRegions, setIsLoadingRegions] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)

  const loadRegions = useCallback(async (countryCode: string) => {
    setIsLoadingRegions(true)
    try {
      const response = await fetch(`/api/countries/${countryCode}/regions`)
      if (response.ok) {
        const data: Region[] = await response.json()
        setRegions(data)
        return data
      } else {
        setRegions([])
        return []
      }
    } catch {
      setRegions([])
      return []
    } finally {
      setIsLoadingRegions(false)
    }
  }, [])

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch('/api/countries')
        if (response.ok) {
          setCountries(await response.json())
        }
      } finally {
        setIsLoadingCountries(false)
      }
    }
    loadCountries()
    loadRegions(country)
  }, [country, loadRegions])

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    setDefaultState('')
    loadRegions(newCountry)
  }

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      showToast(t('locationFailed'), 'error')
      return
    }

    setIsDetecting(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const { latitude, longitude } = position.coords
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
        { headers: { 'User-Agent': 'daydesk/1.0' } }
      )

      if (!response.ok) throw new Error('Reverse geocoding failed')

      const data = await response.json()
      const detectedCountryCode = data.address?.country_code?.toUpperCase()
      const detectedState = data.address?.state

      if (detectedCountryCode) {
        // Check if detected country is in the available countries list
        const isAvailable = countries.some((c) => c.countryCode === detectedCountryCode)
        if (isAvailable) {
          setCountry(detectedCountryCode)

          // Load regions for detected country and try to match state
          const loadedRegions = await loadRegions(detectedCountryCode)
          if (detectedState && loadedRegions.length > 0) {
            const matchedRegion = loadedRegions.find(
              (r) => r.name.toLowerCase() === detectedState.toLowerCase()
            )
            if (matchedRegion) {
              setDefaultState(matchedRegion.code)
            }
          }

          showToast(t('locationDetected'), 'success')
        } else {
          showToast(t('locationFailed'), 'error')
        }
      } else {
        showToast(t('locationFailed'), 'error')
      }
    } catch (error) {
      if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
        showToast(t('locationDenied'), 'error')
      } else {
        showToast(t('locationFailed'), 'error')
      }
    } finally {
      setIsDetecting(false)
    }
  }

  const handleNext = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, defaultState }),
      })
      onNext()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
        {t('countryTitle')}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        {t('countryDescription')}
      </p>

      <button
        onClick={detectLocation}
        disabled={isDetecting || isLoadingCountries}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-50"
      >
        {isDetecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {isDetecting ? t('detecting') : t('detectLocation')}
      </button>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            {t('country')}
          </label>
          {isLoadingCountries ? (
            <Skeleton className="h-10 rounded-lg" />
          ) : (
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
          )}
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
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          {t('back')}
        </button>
        <button
          onClick={handleNext}
          disabled={isSaving}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {isSaving ? '...' : t('next')}
        </button>
      </div>
      <button
        onClick={onSkip}
        className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium text-text-tertiary transition-colors hover:text-text-secondary"
      >
        {t('skip')}
      </button>
    </div>
  )
}
