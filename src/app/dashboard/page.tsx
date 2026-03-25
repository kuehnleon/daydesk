'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { signOut } from 'next-auth/react'
import { useToast } from '@/components/ui/toast'
import { Building2, Home, Check } from 'lucide-react'
import type { Location, TransportType } from '@/types'

interface TodayAttendance {
  type: string
  transport: TransportType
  locationId: string | null
}

const TRANSPORT_LABELS: Record<string, string> = {
  own_car: 'Own Car',
  company_car: 'Company Car',
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const { showToast } = useToast()

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    setIsMounted(true)
    fetchTodayAttendance()
    fetchLocations()
  }, [])

  const fetchTodayAttendance = async () => {
    try {
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')
      const monthStr = format(now, 'yyyy-MM')

      const response = await fetch(`/api/attendance?month=${monthStr}`)
      if (response.ok) {
        const data = await response.json()
        const todayEntry = data.find((entry: { date: string }) => {
          const entryDate = format(new Date(entry.date), 'yyyy-MM-dd')
          return entryDate === todayStr
        })

        if (todayEntry) {
          setTodayAttendance({
            type: todayEntry.type,
            transport: todayEntry.transport,
            locationId: todayEntry.locationId,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const logAttendance = async (
    type: string,
    transport: TransportType,
    locationId: string | null = null
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          type,
          transport,
          locationId,
        }),
      })

      if (response.ok) {
        setTodayAttendance({ type, transport, locationId })
        showToast('Attendance logged successfully!', 'success')
      } else {
        showToast('Failed to log attendance', 'error')
      }
    } catch {
      showToast('Error logging attendance', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const isSelectedLocation = (locationId: string) => {
    if (!isMounted || !todayAttendance) return false
    return todayAttendance.locationId === locationId
  }

  const isSelectedHomeOffice = () => {
    if (!isMounted || !todayAttendance) return false
    return todayAttendance.type === 'home' && !todayAttendance.locationId
  }

  const baseButtonClasses =
    'relative flex flex-col items-center justify-center rounded-2xl p-6 text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50'

  // Darken a hex color for hover state
  const darkenColor = (hex: string): string => {
    const num = parseInt(hex.slice(1), 16)
    const r = Math.max(0, (num >> 16) - 20)
    const g = Math.max(0, ((num >> 8) & 0x00ff) - 20)
    const b = Math.max(0, (num & 0x0000ff) - 20)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white shadow-sm dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                WorkLog
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/calendar"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Calendar
              </a>
              <a
                href="/export"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Export
              </a>
              <a
                href="/settings"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Settings
              </a>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Quick Log</h2>
          <p
            className="mt-2 text-sm text-gray-600 dark:text-gray-400"
            suppressHydrationWarning
          >
            {`Log your attendance for today: ${format(new Date(), 'EEEE, MMMM d, yyyy')}`}
          </p>
        </div>

        {locations.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              No locations configured.{' '}
              <a href="/settings" className="text-indigo-600 hover:underline dark:text-indigo-400">
                Add locations in Settings
              </a>{' '}
              to create quick-log shortcuts.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* User's custom locations */}
            {locations.map((location) => {
              const selected = isSelectedLocation(location.id)
              return (
                <button
                  key={location.id}
                  onClick={() => logAttendance('office', location.transport, location.id)}
                  disabled={isLoading}
                  className={baseButtonClasses}
                  style={{
                    backgroundColor: location.color,
                    boxShadow: selected
                      ? `0 0 0 4px white, 0 0 0 6px ${location.color}`
                      : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = darkenColor(location.color)
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = location.color
                  }}
                >
                  {selected && (
                    <div className="absolute top-3 right-3 rounded-full bg-white p-1">
                      <Check className="h-4 w-4" style={{ color: location.color }} strokeWidth={3} />
                    </div>
                  )}
                  <Building2 className="mb-3 h-12 w-12" />
                  <span className="text-lg font-semibold">{location.name}</span>
                  {location.transport && (
                    <span className="text-sm opacity-90">
                      ({TRANSPORT_LABELS[location.transport] || location.transport})
                    </span>
                  )}
                  {location.distance && (
                    <span className="mt-1 text-xs opacity-75">{location.distance} km</span>
                  )}
                </button>
              )
            })}

            {/* Built-in Home Office */}
            <button
              onClick={() => logAttendance('home', null, null)}
              disabled={isLoading}
              className={`${baseButtonClasses} bg-emerald-500 hover:bg-emerald-600 ${
                isSelectedHomeOffice()
                  ? 'ring-4 ring-emerald-300 ring-offset-2 dark:ring-emerald-400 dark:ring-offset-gray-900'
                  : ''
              }`}
            >
              {isSelectedHomeOffice() && (
                <div className="absolute top-3 right-3 rounded-full bg-white p-1">
                  <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />
                </div>
              )}
              <Home className="mb-3 h-12 w-12" />
              <span className="text-lg font-semibold">Home Office</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
