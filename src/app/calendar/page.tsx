'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns'

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [holidays, setHolidays] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAttendances()
    loadHolidays()
  }, [currentMonth])

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
      const dates = new Set(data.map((h: any) => h.date))
      setHolidays(dates)
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getDayColor = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const attendance = attendances[dateStr]
    const dayOfWeek = getDay(date)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    if (holidays.has(dateStr)) return 'bg-red-100 dark:bg-red-900'
    if (attendance?.type === 'office') return 'bg-blue-100 dark:bg-blue-900'
    if (attendance?.type === 'home') return 'bg-green-100 dark:bg-green-900'
    if (isWeekend) return 'bg-gray-100 dark:bg-gray-800'
    return 'bg-white dark:bg-gray-700'
  }

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
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
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
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}

          {Array.from({ length: getDay(monthStart) }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const attendance = attendances[dateStr]

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                className={`
                  min-h-20 rounded-lg p-2 text-left transition-all hover:ring-2 hover:ring-indigo-500
                  ${getDayColor(day)}
                  ${isToday(day) ? 'ring-2 ring-indigo-600' : ''}
                `}
              >
                <div className="text-sm font-semibold">{format(day, 'd')}</div>
                {attendance && (
                  <div className="mt-1 text-xs">
                    {attendance.type}
                    {attendance.transport && ` (${attendance.transport.replace('_', ' ')})`}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
