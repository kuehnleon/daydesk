'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/toast'
import type { AvailableCountry, Region } from '@/types'

export function useGeneralSettings() {
  const [country, setCountry] = useState('DE')
  const [defaultState, setDefaultState] = useState('BW')
  const [workDays, setWorkDays] = useState('1,2,3,4,5')
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [countries, setCountries] = useState<AvailableCountry[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(true)
  const { showToast } = useToast()
  const t = useTranslations('settings')

  const loadRegions = useCallback(async (countryCode: string) => {
    setIsLoadingRegions(true)
    try {
      const response = await fetch(`/api/countries/${countryCode}/regions`)
      if (response.ok) {
        const data: Region[] = await response.json()
        setRegions(data)
      } else {
        setRegions([])
      }
    } catch {
      setRegions([])
    } finally {
      setIsLoadingRegions(false)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)

    const loadSettings = async () => {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setCountry(data.country ?? 'DE')
        setDefaultState(data.defaultState)
        setWorkDays(data.workDays)
        setWeekStartDay(data.weekStartDay ?? 1)
        await loadRegions(data.country ?? 'DE')
      }
    }

    const loadCountries = async () => {
      const response = await fetch('/api/countries')
      if (response.ok) {
        const data: AvailableCountry[] = await response.json()
        setCountries(data)
      }
    }

    Promise.all([loadSettings(), loadCountries()]).then(() => {
      setIsLoaded(true)
    })
  }, [loadRegions])

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    setDefaultState('')
    loadRegions(newCountry)
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, defaultState, workDays, weekStartDay }),
      })

      if (response.ok) {
        showToast(t('settingsSaved'), 'success')
      } else {
        showToast(t('failedToSave'), 'error')
      }
    } catch {
      showToast(t('errorSaving'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleWorkDay = (day: number) => {
    const days = workDays.split(',').map(Number)
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day].sort()
    setWorkDays(newDays.join(','))
  }

  const handleLocaleChange = async (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax${window.location.protocol === 'https:' ? ';secure' : ''}`
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      })
    } catch {
      // Best-effort DB save; cookie is already set
    }
    window.location.reload()
  }

  return {
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
  }
}
