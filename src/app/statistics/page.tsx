'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'
import { Navbar } from '@/components/navbar'
import { Building2, Home, Palmtree, Car, MapPin, Calendar, TrendingUp, ThermometerSun } from 'lucide-react'
import type { Location, Transport } from '@/types'

interface Attendance {
  id: string
  date: string
  type: string
  transportId: string | null
  transport: Transport | null
  locationId: string | null
  location: (Location & { transport: Transport | null }) | null
  notes: string | null
}

type DatePreset = 'this-month' | 'last-month' | 'this-year' | 'custom'

export default function Statistics() {
  const [preset, setPreset] = useState<DatePreset>('this-month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [transports, setTransports] = useState<Transport[]>([])

  // Initialize dates based on preset
  useEffect(() => {
    const now = new Date()
    let start: Date
    let end: Date

    switch (preset) {
      case 'this-month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'last-month':
        const lastMonth = subMonths(now, 1)
        start = startOfMonth(lastMonth)
        end = endOfMonth(lastMonth)
        break
      case 'this-year':
        start = startOfYear(now)
        end = endOfYear(now)
        break
      case 'custom':
        return // Don't override custom dates
    }

    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
  }, [preset])

  useEffect(() => {
    loadLocations()
    loadTransports()
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadAttendances()
    }
  }, [startDate, endDate])

  const loadLocations = async () => {
    const response = await fetch('/api/locations')
    if (response.ok) {
      const data = await response.json()
      setLocations(data)
    }
  }

  const loadTransports = async () => {
    const response = await fetch('/api/transports')
    if (response.ok) {
      const data = await response.json()
      setTransports(data)
    }
  }

  const loadAttendances = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/attendance?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setAttendances(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate statistics
  const getTypeStats = () => {
    const stats = {
      office: 0,
      home: 0,
      off: 0,
      holiday: 0,
      sick: 0,
    }

    attendances.forEach((a) => {
      if (a.type in stats) {
        stats[a.type as keyof typeof stats]++
      }
    })

    return stats
  }

  const getLocationStats = () => {
    const stats: Record<string, { count: number; location: Location }> = {}

    attendances.forEach((a) => {
      if (a.type === 'office' && a.locationId && a.location) {
        if (!stats[a.locationId]) {
          stats[a.locationId] = { count: 0, location: a.location }
        }
        stats[a.locationId].count++
      }
    })

    return Object.values(stats).sort((a, b) => b.count - a.count)
  }

  const getTransportStats = () => {
    const stats: Record<string, { count: number; transport: Transport }> = {}

    attendances.forEach((a) => {
      // Check for direct transport or location's transport
      const transport = a.transport || a.location?.transport
      if (transport) {
        if (!stats[transport.id]) {
          stats[transport.id] = { count: 0, transport }
        }
        stats[transport.id].count++
      }
    })

    return Object.values(stats).sort((a, b) => b.count - a.count)
  }

  const getDistanceStats = () => {
    let totalDistance = 0
    let daysWithDistance = 0

    attendances.forEach((a) => {
      if (a.location?.distance) {
        totalDistance += a.location.distance * 2 // Round trip
        daysWithDistance++
      }
    })

    return {
      total: totalDistance,
      average: daysWithDistance > 0 ? Math.round(totalDistance / daysWithDistance) : 0,
      days: daysWithDistance,
    }
  }

  const typeStats = getTypeStats()
  const locationStats = getLocationStats()
  const transportStats = getTransportStats()
  const distanceStats = getDistanceStats()
  const totalDays = attendances.length

  const typeConfig = [
    { key: 'office', label: 'Office', icon: Building2, color: '#3B82F6' },
    { key: 'home', label: 'Home Office', icon: Home, color: '#10B981' },
    { key: 'off', label: 'Day Off', icon: Palmtree, color: '#F59E0B' },
    { key: 'holiday', label: 'Holiday', icon: Calendar, color: '#8B5CF6' },
    { key: 'sick', label: 'Sick', icon: ThermometerSun, color: '#EF4444' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Statistics</h2>

        {/* Date Range Selector */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Period
              </label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as DatePreset)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {preset === 'custom' && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </>
            )}

            {startDate && endDate && (
              <div className="flex h-[42px] items-center text-sm text-gray-500 dark:text-gray-400">
                Showing: {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Loading statistics...</div>
        ) : (
          <>
            {/* Attendance Overview */}
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Overview
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({totalDays} days total)
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {typeConfig.map(({ key, label, icon: Icon, color }) => {
                  const count = typeStats[key as keyof typeof typeStats]
                  const percentage = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"
                    >
                      <div
                        className="rounded-lg p-2"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {count}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {label} ({percentage}%)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Location Breakdown */}
            {locationStats.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Office Locations
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {locationStats.map(({ count, location }) => (
                    <div
                      key={location.id}
                      className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"
                    >
                      <div
                        className="rounded-lg p-2"
                        style={{ backgroundColor: `${location.color}20` }}
                      >
                        <Building2 className="h-5 w-5" style={{ color: location.color }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {count}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {location.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transport Methods */}
            {transportStats.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Transport Methods
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {transportStats.map(({ count, transport }) => (
                    <div
                      key={transport.id}
                      className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"
                    >
                      <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                        <Car className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {count}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {transport.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Distance Summary */}
            {distanceStats.total > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Distance Summary
                </h3>
                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/30">
                        <MapPin className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {distanceStats.total.toLocaleString()} km
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Total distance (round trip)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                        <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {distanceStats.average} km
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Average per commute day
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                        <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {distanceStats.days}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Days with commute
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {totalDays === 0 && (
              <div className="rounded-2xl bg-white p-12 text-center shadow-lg dark:bg-gray-800">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No data for this period
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Try selecting a different time period or log some attendance first.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
