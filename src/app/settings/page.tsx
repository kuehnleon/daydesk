'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useToast } from '@/components/ui/toast'
import { Navbar } from '@/components/navbar'
import { ReminderSettings } from '@/components/settings/reminder-settings'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { minLoadingDelay } from '@/lib/loading'
import type { Location, Transport } from '@/types'

interface AvailableCountry {
  countryCode: string
  name: string
}

interface Region {
  code: string
  name: string
}

const COLOR_OPTIONS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#6366F1', // indigo
]

// Home Office uses emerald (#10B981) - reserved, not in COLOR_OPTIONS

interface LocationFormData {
  name: string
  transportId: string
  distance: string
  color: string
}

interface TransportFormData {
  name: string
}

export default function Settings() {
  const [country, setCountry] = useState('DE')
  const [defaultState, setDefaultState] = useState('BW')
  const [workDays, setWorkDays] = useState('1,2,3,4,5')
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [countries, setCountries] = useState<AvailableCountry[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(true)
  const { showToast } = useToast()
  const t = useTranslations('settings')
  const tDays = useTranslations('days')
  const currentLocale = useLocale()

  // Transport state
  const [transports, setTransports] = useState<Transport[]>([])
  const [isLoadingTransports, setIsLoadingTransports] = useState(true)
  const [showTransportModal, setShowTransportModal] = useState(false)
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null)
  const [transportForm, setTransportForm] = useState<TransportFormData>({ name: '' })

  // Location state
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [locationForm, setLocationForm] = useState<LocationFormData>({
    name: '',
    transportId: '',
    distance: '',
    color: COLOR_OPTIONS[0],
  })

  useEffect(() => {
    setIsMounted(true)
    loadSettings()
    loadCountries()
    loadTransports()
    loadLocations()
  }, [])

  const loadSettings = async () => {
    const response = await fetch('/api/settings')
    if (response.ok) {
      const data = await response.json()
      setCountry(data.country ?? 'DE')
      setDefaultState(data.defaultState)
      setWorkDays(data.workDays)
      setWeekStartDay(data.weekStartDay ?? 1)
      // Load regions for the user's saved country
      loadRegions(data.country ?? 'DE')
    }
  }

  const loadCountries = async () => {
    const response = await fetch('/api/countries')
    if (response.ok) {
      const data: AvailableCountry[] = await response.json()
      setCountries(data)
    }
  }

  const loadRegions = async (countryCode: string) => {
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
  }

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    setDefaultState('') // Reset region when country changes
    loadRegions(newCountry)
  }

  const loadTransports = async () => {
    setIsLoadingTransports(true)
    try {
      const [response] = await Promise.all([fetch('/api/transports'), minLoadingDelay()])
      if (response.ok) {
        const data = await response.json()
        setTransports(data)
      }
    } finally {
      setIsLoadingTransports(false)
    }
  }

  const loadLocations = async () => {
    setIsLoadingLocations(true)
    try {
      const [response] = await Promise.all([fetch('/api/locations'), minLoadingDelay()])
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } finally {
      setIsLoadingLocations(false)
    }
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

  // Transport handlers
  const openAddTransport = () => {
    setEditingTransport(null)
    setTransportForm({ name: '' })
    setShowTransportModal(true)
  }

  const openEditTransport = (transport: Transport) => {
    setEditingTransport(transport)
    setTransportForm({ name: transport.name })
    setShowTransportModal(true)
  }

  const saveTransport = async () => {
    if (!transportForm.name.trim()) {
      showToast(t('nameRequired'), 'error')
      return
    }

    try {
      if (editingTransport) {
        const response = await fetch(`/api/transports/${editingTransport.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transportForm),
        })
        if (response.ok) {
          showToast(t('transportUpdated'), 'success')
        } else {
          showToast(t('failedToUpdateTransport'), 'error')
          return
        }
      } else {
        const response = await fetch('/api/transports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transportForm),
        })
        if (response.ok) {
          showToast(t('transportAdded'), 'success')
        } else {
          showToast(t('failedToAddTransport'), 'error')
          return
        }
      }
      setShowTransportModal(false)
      loadTransports()
      loadLocations() // Refresh to get updated transport names
    } catch {
      showToast(t('errorSavingTransport'), 'error')
    }
  }

  const deleteTransport = async (id: string) => {
    if (!confirm(t('deleteTransportConfirm'))) {
      return
    }

    try {
      const response = await fetch(`/api/transports/${id}`, { method: 'DELETE' })
      if (response.ok) {
        showToast(t('transportDeleted'), 'success')
        loadTransports()
        loadLocations()
      } else {
        showToast(t('failedToDeleteTransport'), 'error')
      }
    } catch {
      showToast(t('errorDeletingTransport'), 'error')
    }
  }

  // Location handlers
  const openAddLocation = () => {
    setEditingLocation(null)
    setLocationForm({
      name: '',
      transportId: '',
      distance: '',
      color: COLOR_OPTIONS[0],
    })
    setShowLocationModal(true)
  }

  const openEditLocation = (location: Location) => {
    setEditingLocation(location)
    setLocationForm({
      name: location.name,
      transportId: location.transportId || '',
      distance: location.distance?.toString() || '',
      color: location.color,
    })
    setShowLocationModal(true)
  }

  const saveLocation = async () => {
    if (!locationForm.name.trim()) {
      showToast(t('nameRequired'), 'error')
      return
    }

    try {
      if (editingLocation) {
        const response = await fetch(`/api/locations/${editingLocation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(locationForm),
        })
        if (response.ok) {
          showToast(t('locationUpdated'), 'success')
        } else {
          showToast(t('failedToUpdateLocation'), 'error')
          return
        }
      } else {
        const response = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(locationForm),
        })
        if (response.ok) {
          showToast(t('locationAdded'), 'success')
        } else {
          showToast(t('failedToAddLocation'), 'error')
          return
        }
      }
      setShowLocationModal(false)
      loadLocations()
    } catch {
      showToast(t('errorSavingLocation'), 'error')
    }
  }

  const deleteLocation = async (id: string) => {
    if (!confirm(t('deleteLocationConfirm'))) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      if (response.ok) {
        showToast(t('locationDeleted'), 'success')
        loadLocations()
      } else {
        showToast(t('failedToDeleteLocation'), 'error')
      }
    } catch {
      showToast(t('errorDeletingLocation'), 'error')
    }
  }

  const dayNames = [tDays('monday'), tDays('tuesday'), tDays('wednesday'), tDays('thursday'), tDays('friday'), tDays('saturday'), tDays('sunday')]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-6 pb-[calc(1.5rem+var(--sai-bottom))] sm:py-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-text-primary sm:mb-8 sm:text-3xl">{t('title')}</h2>

        {/* Transport Methods Section */}
        <div className="mb-6 card p-4 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">{t('transportMethods')}</h3>
            <button
              onClick={openAddTransport}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              {t('add')}
            </button>
          </div>

          {!isMounted || isLoadingTransports ? (
            <div className="space-y-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : transports.length === 0 ? (
            <p className="text-sm text-text-secondary">
              {t('noTransportMethods')}
            </p>
          ) : (
            <div className="space-y-2">
              {transports.map((transport) => (
                <div
                  key={transport.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
                >
                  <GripVertical className="h-4 w-4 text-text-tertiary" />
                  <span className="flex-1 font-medium text-text-primary">
                    {transport.name}
                  </span>
                  <button
                    onClick={() => openEditTransport(transport)}
                    className="rounded p-1 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTransport(transport.id)}
                    className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Locations Section */}
        <div className="mb-6 card p-4 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">{t('yourLocations')}</h3>
            <button
              onClick={openAddLocation}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              {t('add')}
            </button>
          </div>

          {!isMounted || isLoadingLocations ? (
            <div className="space-y-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
                >
                  <GripVertical className="h-4 w-4 text-text-tertiary" />
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: location.color }}
                  />
                  <span className="flex-1 font-medium text-text-primary">
                    {location.name}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {location.transport?.name || t('noTransport')}
                  </span>
                  {location.distance && (
                    <span className="text-sm text-text-secondary">
                      {location.distance} km
                    </span>
                  )}
                  <button
                    onClick={() => openEditLocation(location)}
                    className="rounded p-1 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteLocation(location.id)}
                    className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Built-in Home Office */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2">
                <GripVertical className="h-4 w-4 text-text-tertiary" />
                <div className="h-4 w-4 rounded bg-emerald-500" />
                <span className="flex-1 font-medium text-text-primary">
                  {t('homeOffice')}
                </span>
                <span className="text-xs text-text-tertiary">
                  {t('builtIn')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Reminder Notifications Section */}
        <div className="mb-6">
          <ReminderSettings />
        </div>

        {/* Other Settings */}
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
        {/* Version */}
        <p className="mt-6 text-center text-xs text-text-tertiary">
          daydesk v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </main>

      {/* Transport Modal */}
      {showTransportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 my-[calc(1rem+var(--sai-top))] max-h-[calc(100dvh-2rem-var(--sai-top)-var(--sai-bottom))] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-overlay">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {editingTransport ? t('editTransport') : t('addTransport')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={transportForm.name}
                  onChange={(e) => setTransportForm({ ...transportForm, name: e.target.value })}
                  placeholder={t('transportPlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowTransportModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                {t('cancel')}
              </button>
              <button
                onClick={saveTransport}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {editingTransport ? t('save') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 my-[calc(1rem+var(--sai-top))] max-h-[calc(100dvh-2rem-var(--sai-top)-var(--sai-bottom))] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-overlay">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {editingLocation ? t('editLocation') : t('addLocation')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder={t('locationPlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('defaultTransport')}
                </label>
                <select
                  value={locationForm.transportId}
                  onChange={(e) => setLocationForm({ ...locationForm, transportId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                >
                  <option value="">{t('none')}</option>
                  {transports.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('distance')}
                </label>
                <input
                  type="number"
                  value={locationForm.distance}
                  onChange={(e) => setLocationForm({ ...locationForm, distance: e.target.value })}
                  placeholder={t('distancePlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  {t('distanceHelp')}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setLocationForm({ ...locationForm, color })}
                      className={`h-8 w-8 rounded-lg transition-transform ${
                        locationForm.color === color
                          ? 'scale-110 ring-2 ring-offset-2 ring-accent'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                {t('cancel')}
              </button>
              <button
                onClick={saveLocation}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {editingLocation ? t('save') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
