'use client'

import { useState, useEffect } from 'react'
import { GERMAN_STATES } from '@/lib/holidays'
import { useToast } from '@/components/ui/toast'
import { Navbar } from '@/components/navbar'
import { ReminderSettings } from '@/components/settings/reminder-settings'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { minLoadingDelay } from '@/lib/loading'
import type { Location, Transport } from '@/types'

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
  const [defaultState, setDefaultState] = useState('BW')
  const [workDays, setWorkDays] = useState('1,2,3,4,5')
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { showToast } = useToast()

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
    loadTransports()
    loadLocations()
  }, [])

  const loadSettings = async () => {
    const response = await fetch('/api/settings')
    if (response.ok) {
      const data = await response.json()
      setDefaultState(data.defaultState)
      setWorkDays(data.workDays)
      setWeekStartDay(data.weekStartDay ?? 1)
    }
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
        body: JSON.stringify({ defaultState, workDays, weekStartDay }),
      })

      if (response.ok) {
        showToast('Settings saved successfully!', 'success')
      } else {
        showToast('Failed to save settings', 'error')
      }
    } catch {
      showToast('Error saving settings', 'error')
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
      showToast('Name is required', 'error')
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
          showToast('Transport updated', 'success')
        } else {
          showToast('Failed to update transport', 'error')
          return
        }
      } else {
        const response = await fetch('/api/transports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transportForm),
        })
        if (response.ok) {
          showToast('Transport added', 'success')
        } else {
          showToast('Failed to add transport', 'error')
          return
        }
      }
      setShowTransportModal(false)
      loadTransports()
      loadLocations() // Refresh to get updated transport names
    } catch {
      showToast('Error saving transport', 'error')
    }
  }

  const deleteTransport = async (id: string) => {
    if (!confirm('Delete this transport method? Locations using it will have their transport cleared.')) {
      return
    }

    try {
      const response = await fetch(`/api/transports/${id}`, { method: 'DELETE' })
      if (response.ok) {
        showToast('Transport deleted', 'success')
        loadTransports()
        loadLocations()
      } else {
        showToast('Failed to delete transport', 'error')
      }
    } catch {
      showToast('Error deleting transport', 'error')
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
      showToast('Name is required', 'error')
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
          showToast('Location updated', 'success')
        } else {
          showToast('Failed to update location', 'error')
          return
        }
      } else {
        const response = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(locationForm),
        })
        if (response.ok) {
          showToast('Location added', 'success')
        } else {
          showToast('Failed to add location', 'error')
          return
        }
      }
      setShowLocationModal(false)
      loadLocations()
    } catch {
      showToast('Error saving location', 'error')
    }
  }

  const deleteLocation = async (id: string) => {
    if (!confirm('Delete this location? Attendance records using it will keep their data but lose the location reference.')) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      if (response.ok) {
        showToast('Location deleted', 'success')
        loadLocations()
      } else {
        showToast('Failed to delete location', 'error')
      }
    } catch {
      showToast('Error deleting location', 'error')
    }
  }

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-6 pb-[calc(1.5rem+var(--sai-bottom))] sm:py-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-text-primary sm:mb-8 sm:text-3xl">Settings</h2>

        {/* Transport Methods Section */}
        <div className="mb-6 card p-4 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Transport Methods</h3>
            <button
              onClick={openAddTransport}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {!isMounted || isLoadingTransports ? (
            <div className="space-y-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : transports.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No transport methods configured. Add methods like &quot;Own Car&quot;, &quot;Bike&quot;, &quot;Public Transport&quot;.
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
            <h3 className="text-lg font-semibold text-text-primary">Your Locations</h3>
            <button
              onClick={openAddLocation}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Add
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
                    {location.transport?.name || 'No transport'}
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
                  Home Office
                </span>
                <span className="text-xs text-text-tertiary">
                  Built-in
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
              German State (Bundesland)
            </label>
            <select
              value={defaultState}
              onChange={(e) => setDefaultState(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent focus:ring-accent"
            >
              {Object.entries(GERMAN_STATES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-tertiary">
              Used for calculating state-specific public holidays
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Week Starts On
            </label>
            <select
              value={weekStartDay}
              onChange={(e) => setWeekStartDay(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent focus:ring-accent"
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
            <p className="mt-1 text-xs text-text-tertiary">
              First day of the week in the calendar view
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Work Days
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
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>

      {/* Transport Modal */}
      {showTransportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 my-[calc(1rem+var(--sai-top))] max-h-[calc(100dvh-2rem-var(--sai-top)-var(--sai-bottom))] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-overlay">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {editingTransport ? 'Edit Transport' : 'Add Transport'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Name
                </label>
                <input
                  type="text"
                  value={transportForm.name}
                  onChange={(e) => setTransportForm({ ...transportForm, name: e.target.value })}
                  placeholder="e.g., Own Car, Bike, Public Transport"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowTransportModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveTransport}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {editingTransport ? 'Save' : 'Add'}
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
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Name
                </label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="e.g., Office Munich"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Default Transport
                </label>
                <select
                  value={locationForm.transportId}
                  onChange={(e) => setLocationForm({ ...locationForm, transportId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                >
                  <option value="">None</option>
                  {transports.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Distance (km)
                </label>
                <input
                  type="number"
                  value={locationForm.distance}
                  onChange={(e) => setLocationForm({ ...locationForm, distance: e.target.value })}
                  placeholder="e.g., 25"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  One-way commute distance for tax calculations
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Color
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
                Cancel
              </button>
              <button
                onClick={saveLocation}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {editingLocation ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
