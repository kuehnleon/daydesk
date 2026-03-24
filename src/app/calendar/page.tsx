'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay, isBefore, isAfter } from 'date-fns'
import { useToast } from '@/components/ui/toast'

interface Attendance {
  id: string
  date: string
  type: string
  transport: string | null
  notes: string | null
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [attendances, setAttendances] = useState<Record<string, Attendance>>({})
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [holidays, setHolidays] = useState<Set<string>>(new Set())
  const [weekStartDay, setWeekStartDay] = useState(1) // 1 = Monday, 0 = Sunday
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [lastClickedDate, setLastClickedDate] = useState<Date | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadSettings()
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

  // Get day names based on week start
  const getDayNames = () => {
    const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    if (weekStartDay === 1) {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
    return allDays
  }

  // Get the offset for the first day of month based on week start
  const getFirstDayOffset = () => {
    const dayOfWeek = getDay(monthStart) // 0 = Sunday, 1 = Monday, ...
    if (weekStartDay === 1) {
      // Monday start: Monday=0, Tuesday=1, ..., Sunday=6
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
    if (attendance?.type === 'office' && attendance.transport === 'own_car') {
      return 'bg-blue-200 dark:bg-blue-800'
    }
    if (attendance?.type === 'office' && attendance.transport === 'company_car') {
      return 'bg-purple-200 dark:bg-purple-800'
    }
    if (attendance?.type === 'office') return 'bg-blue-100 dark:bg-blue-900'
    if (attendance?.type === 'home') return 'bg-emerald-200 dark:bg-emerald-800'
    if (isWeekend) return 'bg-gray-100 dark:bg-gray-800'
    return 'bg-white dark:bg-gray-700'
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
      // Shift-click: select range from last clicked to current
      const range = getDateRange(lastClickedDate, day)
      const newSelection = new Set(range.map(d => format(d, 'yyyy-MM-dd')))
      setSelectedDates(newSelection)
      setShowModal(true)
    } else {
      // Start drag selection
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
  }

  const getSelectedDatesArray = (): string[] => {
    return Array.from(selectedDates).sort()
  }

  const hasExistingAttendance = (): boolean => {
    return getSelectedDatesArray().some(dateStr => attendances[dateStr])
  }

  const saveAttendance = async (type: string, transport: string | null) => {
    const dates = getSelectedDatesArray()
    if (dates.length === 0) return

    setIsLoading(true)
    try {
      const results = await Promise.all(
        dates.map(dateStr =>
          fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, type, transport }),
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

  // Calculate monthly summary
  const getMonthlySummary = () => {
    const entries = Object.values(attendances)
    const officeOwnCar = entries.filter(a => a.type === 'office' && a.transport === 'own_car').length
    const officeCompanyCar = entries.filter(a => a.type === 'office' && a.transport === 'company_car').length
    const homeOffice = entries.filter(a => a.type === 'home').length
    const totalOffice = officeOwnCar + officeCompanyCar
    return { officeOwnCar, officeCompanyCar, homeOffice, totalOffice, total: entries.length }
  }

  // Icon components for attendance types
  const OfficeIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )

  const HomeIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )

  const CarIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  )

  const getAttendanceIcon = (attendance: Attendance) => {
    if (attendance.type === 'home') {
      return <HomeIcon className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
    }
    if (attendance.type === 'office' && attendance.transport === 'company_car') {
      return (
        <div className="flex items-center gap-0.5">
          <OfficeIcon className="h-5 w-5 text-purple-700 dark:text-purple-300" />
          <CarIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
        </div>
      )
    }
    if (attendance.type === 'office') {
      return (
        <div className="flex items-center gap-0.5">
          <OfficeIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
          {attendance.transport && <CarIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
        </div>
      )
    }
    return null
  }

  const summary = getMonthlySummary()

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
              <a href="/export" className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300">
                Export
              </a>
              <a href="/settings" className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300">
                Settings
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Next
            </button>
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Click a day to edit, or drag to select multiple days. Shift-click to select a range.
        </p>

        {/* Monthly Summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="rounded-lg bg-blue-200 p-2 dark:bg-blue-800">
              <OfficeIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.officeOwnCar}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Office (Own Car)</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="rounded-lg bg-purple-200 p-2 dark:bg-purple-800">
              <OfficeIcon className="h-5 w-5 text-purple-700 dark:text-purple-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.officeCompanyCar}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Office (Company Car)</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="rounded-lg bg-emerald-200 p-2 dark:bg-emerald-800">
              <HomeIcon className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.homeOffice}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Home Office</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="rounded-lg bg-gray-200 p-2 dark:bg-gray-700">
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Days</div>
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
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{format(day, 'd')}</span>
                  {attendance && getAttendanceIcon(attendance)}
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
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => saveAttendance('office', 'own_car')}
                disabled={isLoading}
                className="relative flex items-center gap-4 rounded-xl bg-blue-500 p-4 text-left text-white transition-all hover:scale-[1.02] hover:bg-blue-600 disabled:opacity-50"
              >
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <div className="font-semibold">Office</div>
                  <div className="text-sm opacity-90">Own Car</div>
                </div>
              </button>

              <button
                onClick={() => saveAttendance('office', 'company_car')}
                disabled={isLoading}
                className="relative flex items-center gap-4 rounded-xl bg-indigo-500 p-4 text-left text-white transition-all hover:scale-[1.02] hover:bg-indigo-600 disabled:opacity-50"
              >
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <div className="font-semibold">Office</div>
                  <div className="text-sm opacity-90">Company Car</div>
                </div>
              </button>

              <button
                onClick={() => saveAttendance('home', null)}
                disabled={isLoading}
                className="relative flex items-center gap-4 rounded-xl bg-green-500 p-4 text-left text-white transition-all hover:scale-[1.02] hover:bg-green-600 disabled:opacity-50"
              >
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div>
                  <div className="font-semibold">Home Office</div>
                </div>
              </button>
            </div>

            {hasExistingAttendance() && (
              <button
                onClick={clearAttendance}
                disabled={isLoading}
                className="mt-4 w-full rounded-xl border-2 border-red-300 bg-red-50 p-3 text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
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
