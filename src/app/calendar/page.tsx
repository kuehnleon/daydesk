'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay, isBefore, isAfter } from 'date-fns'
import { useToast } from '@/components/ui/toast'
import { Navbar } from '@/components/navbar'
import {
  Building2,
  Home,
  Car,
  Palmtree,
  ThermometerSun,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart3
} from 'lucide-react'
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

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [attendances, setAttendances] = useState<Record<string, Attendance>>({})
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [holidays, setHolidays] = useState<Set<string>>(new Set())
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [lastClickedDate, setLastClickedDate] = useState<Date | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null)
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadSettings()
    loadLocations()
    loadTransports()
  }, [])

  useEffect(() => {
    loadAttendances()
    loadHolidays()
  }, [currentMonth])

  const loadSettings = async () => {
    const response = await fetch('/api/settings')
    if (response.ok) {
      const data = await response.json()
      setWeekStartDay(data.weekStartDay ?? 1)
    }
  }

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
    const month = format(currentMonth, 'yyyy-MM')
    const response = await fetch(`/api/attendance?month=${month}`)
    if (response.ok) {
      const data = await response.json()
      const map: Record<string, Attendance> = {}
      data.forEach((a: Attendance) => {
        map[a.date.split('T')[0]] = a
      })
      setAttendances(map)
    }
  }

  const loadHolidays = async () => {
    const year = currentMonth.getFullYear()
    const response = await fetch(`/api/holidays?year=${year}`)
    if (response.ok) {
      const data = await response.json()
      const dates = new Set<string>(data.map((h: { date: string }) => h.date))
      setHolidays(dates)
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getDayNames = () => {
    if (weekStartDay === 1) {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  }

  const getFirstDayOffset = () => {
    const dayOfWeek = getDay(monthStart)
    if (weekStartDay === 1) {
      return dayOfWeek === 0 ? 6 : dayOfWeek - 1
    }
    return dayOfWeek
  }

  const getDayColor = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const attendance = attendances[dateStr]
    const dayOfWeek = getDay(date)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    if (holidays.has(dateStr)) return 'bg-red-100 dark:bg-red-900'

    if (attendance?.location?.color) {
      return ''
    }

    if (attendance?.type === 'office') return 'bg-blue-100 dark:bg-blue-900'
    if (attendance?.type === 'home') return 'bg-emerald-200 dark:bg-emerald-800'
    if (attendance?.type === 'off') return 'bg-amber-100 dark:bg-amber-900'
    if (attendance?.type === 'sick') return 'bg-red-100 dark:bg-red-900'
    if (isWeekend) return 'bg-gray-100 dark:bg-gray-800'
    return 'bg-white dark:bg-gray-700'
  }

  const getDayStyle = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const attendance = attendances[dateStr]
    if (attendance?.location?.color) {
      return { backgroundColor: `${attendance.location.color}33` }
    }
    return {}
  }

  const isDateSelected = (date: Date) => {
    return selectedDates.has(format(date, 'yyyy-MM-dd'))
  }

  const getDateRange = (start: Date, end: Date): Date[] => {
    const rangeStart = isBefore(start, end) ? start : end
    const rangeEnd = isAfter(start, end) ? start : end
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  }

  const handleMouseDown = (day: Date, e: React.MouseEvent) => {
    e.preventDefault()

    if (e.shiftKey && lastClickedDate) {
      const range = getDateRange(lastClickedDate, day)
      const newSelection = new Set(range.map(d => format(d, 'yyyy-MM-dd')))
      setSelectedDates(newSelection)
      setShowModal(true)
    } else {
      setIsSelecting(true)
      setSelectionStart(day)
      setSelectedDates(new Set([format(day, 'yyyy-MM-dd')]))
    }
    setLastClickedDate(day)
  }

  const handleMouseEnter = (day: Date) => {
    if (isSelecting && selectionStart) {
      const range = getDateRange(selectionStart, day)
      setSelectedDates(new Set(range.map(d => format(d, 'yyyy-MM-dd'))))
    }
  }

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectedDates.size > 0) {
      setShowModal(true)
    }
    setIsSelecting(false)
    setSelectionStart(null)
  }, [isSelecting, selectedDates.size])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleMouseUp()
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isSelecting, handleMouseUp])

  const closeModal = () => {
    setShowModal(false)
    setSelectedDates(new Set())
    setExpandedLocationId(null)
    setSelectedTransportId(null)
  }

  const getSelectedDatesArray = (): string[] => {
    return Array.from(selectedDates).sort()
  }

  const hasExistingAttendance = (): boolean => {
    return getSelectedDatesArray().some(dateStr => attendances[dateStr])
  }

  const saveAttendance = async (
    type: string,
    transportId: string | null,
    locationId: string | null = null
  ) => {
    const dates = getSelectedDatesArray()
    if (dates.length === 0) return

    setIsLoading(true)
    try {
      const results = await Promise.all(
        dates.map(dateStr =>
          fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, type, transportId, locationId }),
          })
        )
      )

      const allOk = results.every(r => r.ok)
      if (allOk) {
        showToast(`Attendance saved for ${dates.length} day${dates.length > 1 ? 's' : ''}!`, 'success')
        await loadAttendances()
        closeModal()
      } else {
        showToast('Failed to save some entries', 'error')
      }
    } catch {
      showToast('Error saving attendance', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const clearAttendance = async () => {
    const dates = getSelectedDatesArray()
    const toDelete = dates.filter(dateStr => attendances[dateStr])

    if (toDelete.length === 0) {
      closeModal()
      return
    }

    setIsLoading(true)
    try {
      const results = await Promise.all(
        toDelete.map(dateStr =>
          fetch(`/api/attendance/${attendances[dateStr].id}`, { method: 'DELETE' })
        )
      )

      const allOk = results.every(r => r.ok)
      if (allOk) {
        showToast(`Cleared ${toDelete.length} entr${toDelete.length > 1 ? 'ies' : 'y'}`, 'success')
        await loadAttendances()
        closeModal()
      } else {
        showToast('Failed to clear some entries', 'error')
      }
    } catch {
      showToast('Error clearing attendance', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const getModalTitle = () => {
    const dates = getSelectedDatesArray()
    if (dates.length === 1) {
      return format(new Date(dates[0]), 'EEEE, MMMM d, yyyy')
    }
    return `Edit ${dates.length} days`
  }

  const getMonthlySummary = () => {
    const entries = Object.values(attendances)
    const homeOffice = entries.filter(a => a.type === 'home').length
    const total = entries.length

    const locationCounts: Record<string, number> = {}
    let officeNoLocation = 0

    entries.forEach(a => {
      if (a.type === 'office') {
        if (a.locationId && a.location) {
          locationCounts[a.locationId] = (locationCounts[a.locationId] || 0) + 1
        } else {
          officeNoLocation++
        }
      }
    })

    return { homeOffice, total, locationCounts, officeNoLocation }
  }

  const getAttendanceIcon = (attendance: Attendance) => {
    if (attendance.type === 'home') {
      return <Home className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
    }
    if (attendance.type === 'office') {
      const color = attendance.location?.color
      return (
        <Building2
          className="h-5 w-5"
          style={{ color: color || '#3B82F6' }}
        />
      )
    }
    if (attendance.type === 'off') {
      return <Palmtree className="h-5 w-5 text-amber-600 dark:text-amber-400" />
    }
    if (attendance.type === 'sick') {
      return <ThermometerSun className="h-5 w-5 text-red-600 dark:text-red-400" />
    }
    return null
  }

  const summary = getMonthlySummary()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Click a day to edit, or drag to select multiple days. Shift-click to select a range.
        </p>

        {/* Monthly Summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {locations.map(loc => {
            const count = summary.locationCounts[loc.id] || 0
            if (count === 0) return null
            return (
              <div
                key={loc.id}
                className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"
              >
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: `${loc.color}33` }}
                >
                  <Building2 className="h-5 w-5" style={{ color: loc.color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-400">{loc.name}</div>
                </div>
              </div>
            )
          })}

          {summary.officeNoLocation > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="rounded-lg bg-blue-200 p-2 dark:bg-blue-800">
                <Building2 className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.officeNoLocation}</div>
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">Office (Legacy)</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="rounded-lg bg-emerald-200 p-2 dark:bg-emerald-800">
              <Home className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.homeOffice}</div>
              <div className="truncate text-xs text-gray-500 dark:text-gray-400">Home Office</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="rounded-lg bg-gray-200 p-2 dark:bg-gray-700">
              <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</div>
              <div className="truncate text-xs text-gray-500 dark:text-gray-400">Total Days</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 select-none">
          {getDayNames().map(day => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}

          {Array.from({ length: getFirstDayOffset() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const attendance = attendances[dateStr]
            const selected = isDateSelected(day)
            const isHoliday = holidays.has(dateStr)

            return (
              <button
                key={dateStr}
                onMouseDown={(e) => handleMouseDown(day, e)}
                onMouseEnter={() => handleMouseEnter(day)}
                className={`
                  min-h-20 rounded-lg p-2 text-left transition-all
                  ${getDayColor(day)}
                  ${isToday(day) ? 'ring-2 ring-indigo-600' : ''}
                  ${selected ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : 'hover:ring-2 hover:ring-indigo-300'}
                  ${isSelecting ? 'cursor-crosshair' : 'cursor-pointer'}
                `}
                style={getDayStyle(day)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{format(day, 'd')}</span>
                  {isHoliday && <Palmtree className="h-5 w-5 text-red-600 dark:text-red-400" />}
                  {!isHoliday && attendance && getAttendanceIcon(attendance)}
                </div>
              </button>
            )
          })}
        </div>
      </main>

      {/* Attendance Edit Modal */}
      {showModal && selectedDates.size > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {getModalTitle()}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3">
              {locations.map(location => {
                const isExpanded = expandedLocationId === location.id
                const hasTransports = transports.length > 0

                if (isExpanded) {
                  return (
                    <div
                      key={location.id}
                      className="overflow-hidden rounded-xl text-white shadow-lg"
                      style={{ backgroundColor: location.color }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/20 p-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-8 w-8" />
                          <div>
                            <div className="font-semibold">{location.name}</div>
                            <div className="text-sm opacity-80">Select transport method</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setExpandedLocationId(null)
                            setSelectedTransportId(null)
                          }}
                          className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/20"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Transport Options */}
                      <div className="p-3">
                        <div className="grid gap-2">
                          {transports.map(transport => {
                            const isSelected = selectedTransportId === transport.id
                            const isDefault = transport.id === location.transportId
                            return (
                              <button
                                key={transport.id}
                                onClick={() => setSelectedTransportId(transport.id)}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                                  isSelected
                                    ? 'bg-white/25 ring-2 ring-white/50'
                                    : 'bg-white/10 hover:bg-white/20'
                                }`}
                              >
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                  isSelected ? 'border-white bg-white' : 'border-white/60'
                                }`}>
                                  {isSelected && (
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: location.color }} />
                                  )}
                                </div>
                                <span className="flex-1 font-medium">{transport.name}</span>
                                {isDefault && (
                                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">default</span>
                                )}
                              </button>
                            )
                          })}
                          {/* No transport option */}
                          <button
                            onClick={() => setSelectedTransportId(null)}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                              selectedTransportId === null
                                ? 'bg-white/25 ring-2 ring-white/50'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                              selectedTransportId === null ? 'border-white bg-white' : 'border-white/60'
                            }`}>
                              {selectedTransportId === null && (
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: location.color }} />
                              )}
                            </div>
                            <span className="flex-1 font-medium">No transport</span>
                            {!location.transportId && (
                              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">default</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="border-t border-white/20 p-3">
                        <button
                          onClick={() => saveAttendance('office', selectedTransportId, location.id)}
                          disabled={isLoading}
                          className="w-full cursor-pointer rounded-lg bg-white py-2.5 font-semibold transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ color: location.color }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={location.id}
                    className="relative flex items-center rounded-xl text-white transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: location.color }}
                  >
                    <button
                      onClick={() => saveAttendance('office', location.transportId, location.id)}
                      disabled={isLoading}
                      className="flex flex-1 cursor-pointer items-center gap-4 p-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Building2 className="h-10 w-10" />
                      <div>
                        <div className="font-semibold">{location.name}</div>
                        {location.transport && (
                          <div className="text-sm opacity-90">{location.transport.name}</div>
                        )}
                        {location.distance && (
                          <div className="text-xs opacity-75">{location.distance} km</div>
                        )}
                      </div>
                    </button>
                    {hasTransports && (
                      <button
                        onClick={() => {
                          setExpandedLocationId(location.id)
                          // Check if there's existing attendance for this location to preserve its transport
                          const dates = getSelectedDatesArray()
                          if (dates.length === 1) {
                            const existing = attendances[dates[0]]
                            if (existing?.locationId === location.id) {
                              setSelectedTransportId(existing.transportId)
                              return
                            }
                          }
                          setSelectedTransportId(location.transportId)
                        }}
                        disabled={isLoading}
                        className="mr-3 flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Change transport method"
                      >
                        <Car className="h-4 w-4" />
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}

              <button
                onClick={() => saveAttendance('home', null)}
                disabled={isLoading}
                className="relative flex cursor-pointer items-center gap-4 rounded-xl bg-emerald-500 p-4 text-left text-white transition-all hover:scale-[1.02] hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Home className="h-10 w-10" />
                <div>
                  <div className="font-semibold">Home Office</div>
                </div>
              </button>

              <button
                onClick={() => saveAttendance('off', null)}
                disabled={isLoading}
                className="relative flex cursor-pointer items-center gap-4 rounded-xl bg-amber-500 p-4 text-left text-white transition-all hover:scale-[1.02] hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Palmtree className="h-10 w-10" />
                <div>
                  <div className="font-semibold">Day Off</div>
                </div>
              </button>

              <button
                onClick={() => saveAttendance('sick', null)}
                disabled={isLoading}
                className="relative flex cursor-pointer items-center gap-4 rounded-xl bg-red-500 p-4 text-left text-white transition-all hover:scale-[1.02] hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ThermometerSun className="h-10 w-10" />
                <div>
                  <div className="font-semibold">Sick</div>
                </div>
              </button>
            </div>

            {hasExistingAttendance() && (
              <button
                onClick={clearAttendance}
                disabled={isLoading}
                className="mt-4 w-full cursor-pointer rounded-xl border-2 border-red-300 bg-red-50 p-3 text-red-700 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                {selectedDates.size > 1 ? 'Clear All Entries' : 'Clear Entry'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
