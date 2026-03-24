'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { signOut } from 'next-auth/react'
import { useToast } from '@/components/ui/toast'

type AttendanceType = 'office' | 'home' | null
type TransportType = 'own_car' | 'company_car' | null

interface TodayAttendance {
  type: AttendanceType
  transport: TransportType
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const { showToast } = useToast()

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    setIsMounted(true)
    fetchTodayAttendance()
  }, [])

  const fetchTodayAttendance = async () => {
    try {
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')
      const monthStr = format(now, 'yyyy-MM')

      const response = await fetch(`/api/attendance?month=${monthStr}`)
      if (response.ok) {
        const data = await response.json()
        // Find today's attendance by comparing date strings
        const todayEntry = data.find((entry: { date: string }) => {
          const entryDate = format(new Date(entry.date), 'yyyy-MM-dd')
          return entryDate === todayStr
        })

        if (todayEntry) {
          setTodayAttendance({ type: todayEntry.type, transport: todayEntry.transport })
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const logAttendance = async (type: string, transport: string | null) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          type,
          transport,
        }),
      })

      if (response.ok) {
        setTodayAttendance({ type: type as AttendanceType, transport: transport as TransportType })
        showToast('Attendance logged successfully!', 'success')
      } else {
        showToast('Failed to log attendance', 'error')
      }
    } catch (error) {
      showToast('Error logging attendance', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const isSelected = (type: AttendanceType, transport: TransportType) => {
    if (!isMounted || !todayAttendance) return false
    return todayAttendance.type === type && todayAttendance.transport === transport
  }

  // Base classes that are always applied (must match server render)
  const baseButtonClasses = 'flex flex-col items-center justify-center rounded-2xl p-8 text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50'

  const getButtonClasses = (
    type: AttendanceType,
    transport: TransportType,
    baseColor: string,
    hoverColor: string,
    selectedColor: string,
    ringColor: string,
    darkRingColor: string
  ) => {
    const selected = isSelected(type, transport)
    if (selected) {
      return `relative ${baseButtonClasses} ${selectedColor} ring-4 ${ringColor} ring-offset-2 ${darkRingColor} dark:ring-offset-gray-900`
    }
    return `${baseButtonClasses} ${baseColor} ${hoverColor}`
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quick Log
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400" suppressHydrationWarning>
            {`Log your attendance for today: ${format(new Date(), 'EEEE, MMMM d, yyyy')}`}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <button
            onClick={() => logAttendance('office', 'own_car')}
            disabled={isLoading}
            className={getButtonClasses('office', 'own_car', 'bg-blue-500', 'hover:bg-blue-600', 'bg-blue-600', 'ring-blue-300', 'dark:ring-blue-400')}
          >
            {isSelected('office', 'own_car') && (
              <div className="absolute top-3 right-3 rounded-full bg-white p-1">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <svg
              className="h-16 w-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="text-xl font-semibold">Office</span>
            <span className="text-sm opacity-90">(Own Car)</span>
          </button>

          <button
            onClick={() => logAttendance('office', 'company_car')}
            disabled={isLoading}
            className={getButtonClasses('office', 'company_car', 'bg-indigo-500', 'hover:bg-indigo-600', 'bg-indigo-600', 'ring-indigo-300', 'dark:ring-indigo-400')}
          >
            {isSelected('office', 'company_car') && (
              <div className="absolute top-3 right-3 rounded-full bg-white p-1">
                <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <svg
              className="h-16 w-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="text-xl font-semibold">Office</span>
            <span className="text-sm opacity-90">(Company Car)</span>
          </button>

          <button
            onClick={() => logAttendance('home', null)}
            disabled={isLoading}
            className={getButtonClasses('home', null, 'bg-green-500', 'hover:bg-green-600', 'bg-green-600', 'ring-green-300', 'dark:ring-green-400')}
          >
            {isSelected('home', null) && (
              <div className="absolute top-3 right-3 rounded-full bg-white p-1">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <svg
              className="h-16 w-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xl font-semibold">Home Office</span>
          </button>
        </div>
      </main>
    </div>
  )
}
