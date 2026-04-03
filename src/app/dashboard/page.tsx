'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useTranslations, useLocale } from 'next-intl'
import { getDateFnsLocale } from '@/lib/date-locale'
import { useToast } from '@/components/ui/toast'
import { Navbar } from '@/components/navbar'
import { Building2, Home, Palmtree, ThermometerSun } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { minLoadingDelay } from '@/lib/loading'
import { haptic } from '@/lib/haptic'
import { enqueue } from '@/lib/offline-queue'
import type { Location } from '@/types'

interface TodayAttendance {
  type: string
  transportId: string | null
  locationId: string | null
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [dashboardHidden, setDashboardHidden] = useState<Set<string>>(new Set())
  const { showToast } = useToast()
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    Promise.all([fetchTodayAttendance(), fetchLocations(), fetchDashboardHidden(), minLoadingDelay()]).finally(() => {
      setIsLoadingInitial(false)
    })
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
            transportId: todayEntry.transportId,
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

  const fetchDashboardHidden = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.dashboardHidden) {
          setDashboardHidden(new Set(data.dashboardHidden.split(',').filter(Boolean)))
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const logAttendance = async (
    type: string,
    transportId: string | null,
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
          transportId,
          locationId,
        }),
      })

      if (response.ok) {
        setTodayAttendance({ type, transportId, locationId })
        haptic()
        showToast(t('attendanceLogged'), 'success')
      } else {
        showToast(t('failedToLog'), 'error')
      }
    } catch {
      if (!navigator.onLine) {
        await enqueue({ date: today, type, transportId, locationId })
        setTodayAttendance({ type, transportId, locationId })
        haptic()
        showToast(t('savedOffline'), 'success')
      } else {
        showToast(t('errorLogging'), 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isSelectedLocation = (locationId: string) => {
    if (!todayAttendance) return false
    return todayAttendance.locationId === locationId
  }

  const isSelectedHomeOffice = () => {
    if (!todayAttendance) return false
    return todayAttendance.type === 'home' && !todayAttendance.locationId
  }

  const isSelectedType = (type: string) => {
    if (!todayAttendance) return false
    return todayAttendance.type === type
  }

  const baseButtonClasses =
    'relative flex flex-col items-center justify-center rounded-xl p-6 text-white shadow-card transition-all duration-150 hover:shadow-elevated hover:scale-[1.02] disabled:opacity-50'

  const darkenColor = (hex: string): string => {
    const num = parseInt(hex.slice(1), 16)
    const r = Math.max(0, (num >> 16) - 20)
    const g = Math.max(0, ((num >> 8) & 0x00ff) - 20)
    const b = Math.max(0, (num & 0x0000ff) - 20)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-[calc(1.5rem+var(--sai-bottom))] sm:py-12 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">{t('quickLog')}</h2>
          <p
            className="mt-2 text-sm text-text-secondary"
            suppressHydrationWarning
          >
            {t('logForToday', { date: format(new Date(), 'EEEE, MMMM d, yyyy', { locale: dateFnsLocale }) })}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoadingInitial ? (
            <>
              <Skeleton className="h-[140px] rounded-xl" />
              <Skeleton className="h-[140px] rounded-xl" />
              <Skeleton className="h-[140px] rounded-xl" />
              <Skeleton className="h-[140px] rounded-xl" />
              <Skeleton className="h-[140px] rounded-xl" />
              <Skeleton className="h-[140px] rounded-xl" />
            </>
          ) : (
            <>
              {locations.filter((location) => !dashboardHidden.has(location.id)).map((location) => {
                const selected = isSelectedLocation(location.id)
                return (
                  <button
                    key={location.id}
                    onClick={() => logAttendance('office', location.transportId, location.id)}
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
                    <Building2 className="mb-3 h-12 w-12" />
                    <span className="text-lg font-semibold">{location.name}</span>
                    {location.transport && (
                      <span className="text-sm opacity-90">({location.transport.name})</span>
                    )}
                    {location.distance && (
                      <span className="mt-1 text-xs opacity-75">{location.distance} km</span>
                    )}
                  </button>
                )
              })}

              {!dashboardHidden.has('home') && (
              <button
                onClick={() => logAttendance('home', null, null)}
                disabled={isLoading}
                className={`${baseButtonClasses} bg-emerald-500 hover:bg-emerald-600 ${
                  isSelectedHomeOffice()
                    ? 'ring-4 ring-emerald-300 ring-offset-2 dark:ring-emerald-400 dark:ring-offset-background'
                    : ''
                }`}
              >
                <Home className="mb-3 h-12 w-12" />
                <span className="text-lg font-semibold">{t('homeOffice')}</span>
              </button>
              )}

              {!dashboardHidden.has('off') && (
              <button
                onClick={() => logAttendance('off', null, null)}
                disabled={isLoading}
                className={`${baseButtonClasses} bg-amber-500 hover:bg-amber-600 ${
                  isSelectedType('off')
                    ? 'ring-4 ring-amber-300 ring-offset-2 dark:ring-amber-400 dark:ring-offset-background'
                    : ''
                }`}
              >
                <Palmtree className="mb-3 h-12 w-12" />
                <span className="text-lg font-semibold">{t('dayOff')}</span>
              </button>
              )}

              {!dashboardHidden.has('sick') && (
              <button
                onClick={() => logAttendance('sick', null, null)}
                disabled={isLoading}
                className={`${baseButtonClasses} bg-red-500 hover:bg-red-600 ${
                  isSelectedType('sick')
                    ? 'ring-4 ring-red-300 ring-offset-2 dark:ring-red-400 dark:ring-offset-background'
                    : ''
                }`}
              >
                <ThermometerSun className="mb-3 h-12 w-12" />
                <span className="text-lg font-semibold">{t('sick')}</span>
              </button>
              )}
            </>
          )}
        </div>

        {!isLoadingInitial && locations.length === 0 && (
          <p className="mt-4 text-center text-sm text-text-secondary">
            <a href="/settings" className="text-accent hover:underline">
              {t('addLocationsHint')}
            </a>{' '}
            {t('addLocationsHintSuffix')}
          </p>
        )}
      </main>
    </div>
  )
}
