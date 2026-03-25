'use client'

import { useState, useEffect } from 'react'
import { GERMAN_STATES } from '@/lib/holidays'
import { useToast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
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
      const response = await fetch('/api/transports')
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
      const response = await fetch('/api/locations')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white shadow-sm dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <a href="/dashboard" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                WorkLog
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300">
                Dashboard
              </a>
              <a href="/calendar" className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300">
                Calendar
              </a>
              <a href="/export" className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300">
                Export
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Settings</h2>

        {/* Transport Methods Section */}
        <div className="mb-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transport Methods</h3>
            <button
              onClick={openAddTransport}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {!isMounted || isLoadingTransports ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : transports.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No transport methods configured. Add methods like &quot;Own Car&quot;, &quot;Bike&quot;, &quot;Public Transport&quot;.
            </p>
          ) : (
            <div className="space-y-2">
              {transports.map((transport) => (
                <div
                  key={transport.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-700/50"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="flex-1 font-medium text-gray-900 dark:text-white">
                    {transport.name}
                  </span>
                  <button
                    onClick={() => openEditTransport(transport)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-300"
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
        <div className="mb-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Locations</h3>
            <button
              onClick={openAddLocation}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {!isMounted || isLoadingLocations ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-700/50"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: location.color }}
                  />
                  <span className="flex-1 font-medium text-gray-900 dark:text-white">
                    {location.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {location.transport?.name || 'No transport'}
                  </span>
                  {location.distance && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {location.distance} km
                    </span>
                  )}
                  <button
                    onClick={() => openEditLocation(location)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-300"
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
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-700/50">
                <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                <div className="h-4 w-4 rounded bg-emerald-500" />
                <span className="flex-1 font-medium text-gray-900 dark:text-white">
                  Home Office
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Built-in
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Other Settings */}
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              German State (Bundesland)
            </label>
            <select
              value={defaultState}
              onChange={(e) => setDefaultState(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {Object.entries(GERMAN_STATES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used for calculating state-specific public holidays
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Week Starts On
            </label>
            <select
              value={weekStartDay}
              onChange={(e) => setWeekStartDay(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              First day of the week in the calendar view
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>

      {/* Transport Modal */}
      {showTransportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {editingTransport ? 'Edit Transport' : 'Add Transport'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={transportForm.name}
                  onChange={(e) => setTransportForm({ ...transportForm, name: e.target.value })}
                  placeholder="e.g., Own Car, Bike, Public Transport"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowTransportModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveTransport}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="e.g., Office Munich"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Transport
                </label>
                <select
                  value={locationForm.transportId}
                  onChange={(e) => setLocationForm({ ...locationForm, transportId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Distance (km)
                </label>
                <input
                  type="number"
                  value={locationForm.distance}
                  onChange={(e) => setLocationForm({ ...locationForm, distance: e.target.value })}
                  placeholder="e.g., 25"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  One-way commute distance for tax calculations
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setLocationForm({ ...locationForm, color })}
                      className={`h-8 w-8 rounded-lg transition-transform ${
                        locationForm.color === color
                          ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500'
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
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveLocation}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
