'use client'

import { useState, useEffect } from 'react'
import { GERMAN_STATES } from '@/lib/holidays'
import { useToast } from '@/components/ui/toast'

export default function Settings() {
  const [defaultState, setDefaultState] = useState('BW')
  const [workDays, setWorkDays] = useState('1,2,3,4,5')
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadSettings()
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
    } catch (error) {
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
    </div>
  )
}
