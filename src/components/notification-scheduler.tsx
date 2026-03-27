'use client'

import { useEffect, useRef, useCallback } from 'react'
import { format, getDay } from 'date-fns'
import type { ReminderSettings } from '@/types'

const STORAGE_KEY = 'daydesk-reminder-settings'
const LAST_SHOWN_KEY = 'daydesk-reminder-last-shown'

export function NotificationScheduler() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastCheckedMinute = useRef<string>('')

  const getSettings = useCallback((): ReminderSettings | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as ReminderSettings
      }
    } catch {
      // Invalid JSON
    }
    return null
  }, [])

  const getWorkDays = useCallback(async (): Promise<number[]> => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        return data.workDays.split(',').map(Number)
      }
    } catch {
      // Default to Mon-Fri
    }
    return [1, 2, 3, 4, 5]
  }, [])

  const checkTodayAttendance = useCallback(async (): Promise<boolean> => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const month = format(new Date(), 'yyyy-MM')

    try {
      const response = await fetch(`/api/attendance?month=${month}`)
      if (!response.ok) return true // Fail safe: don't notify if can't check

      const data = await response.json()
      const todayEntry = data.find((entry: { date: string }) => {
        const entryDate = entry.date.split('T')[0]
        return entryDate === today
      })

      return !!todayEntry // true = logged, false = not logged
    } catch {
      return true // Fail safe
    }
  }, [])

  const wasAlreadyShown = useCallback((time: string): boolean => {
    const today = format(new Date(), 'yyyy-MM-dd')
    try {
      const stored = localStorage.getItem(LAST_SHOWN_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        return data.date === today && data.times?.includes(time)
      }
    } catch {
      // Invalid JSON
    }
    return false
  }, [])

  const markAsShown = useCallback((time: string) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    try {
      const stored = localStorage.getItem(LAST_SHOWN_KEY)
      let data = { date: today, times: [] as string[] }

      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.date === today) {
          data = parsed
        }
      }

      if (!data.times.includes(time)) {
        data.times.push(time)
      }

      localStorage.setItem(LAST_SHOWN_KEY, JSON.stringify(data))
    } catch {
      // Storage full
    }
  }, [])

  const showNotification = useCallback(async () => {
    if (Notification.permission !== 'granted') return

    const options = {
      body: "Don't forget to log your attendance for today!",
      icon: '/icon-192.png',
      tag: 'daydesk-attendance-reminder',
    }

    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration?.active) {
      await registration.showNotification('Daydesk Reminder', options)
    } else {
      new Notification('Daydesk Reminder', options)
    }
  }, [])

  const checkAndNotify = useCallback(async () => {
    // Check if notifications are supported and permitted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const settings = getSettings()
    if (!settings?.enabled || settings.times.length === 0) {
      return
    }

    const now = new Date()
    const currentTime = format(now, 'HH:mm')

    // Prevent checking same minute twice
    if (currentTime === lastCheckedMinute.current) {
      return
    }
    lastCheckedMinute.current = currentTime

    // Check if current time matches any reminder
    if (!settings.times.includes(currentTime)) {
      return
    }

    // Check if already shown for this time today
    if (wasAlreadyShown(currentTime)) {
      return
    }

    // Check work days if enabled
    if (settings.workDaysOnly) {
      const workDays = await getWorkDays()
      const todayDow = getDay(now) // 0 = Sunday
      const adjustedDay = todayDow === 0 ? 7 : todayDow // Convert to 1-7 (Mon-Sun)

      if (!workDays.includes(adjustedDay)) {
        return
      }
    }

    // Check if attendance is already logged
    const isLogged = await checkTodayAttendance()
    if (isLogged) {
      // Mark as shown anyway to prevent repeated API calls
      markAsShown(currentTime)
      return
    }

    // Show notification
    await showNotification()
    markAsShown(currentTime)
  }, [getSettings, getWorkDays, checkTodayAttendance, wasAlreadyShown, markAsShown, showNotification])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initial check
    checkAndNotify()

    // Check every 30 seconds
    intervalRef.current = setInterval(checkAndNotify, 30_000)

    // Handle visibility change - check when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndNotify()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [checkAndNotify])

  return null
}
