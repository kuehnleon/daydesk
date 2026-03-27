'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReminderSettings } from '@/types'

const STORAGE_KEY = 'daydesk-reminder-settings'

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  times: [],
  workDaysOnly: true,
}

export type NotificationPermissionState = NotificationPermission | 'unsupported'

export function useNotificationReminders() {
  const [permission, setPermission] = useState<NotificationPermissionState>('default')
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check notification support
    if (!('Notification' in window)) {
      setPermission('unsupported')
    } else {
      setPermission(Notification.permission)
    }

    // Load settings
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ReminderSettings
        setSettings(parsed)
      }
    } catch {
      // Use defaults
    }
    setIsLoaded(true)
  }, [])

  // Save settings to localStorage
  const updateSettings = useCallback((updates: Partial<ReminderSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      } catch {
        // Storage full or unavailable
      }
      return newSettings
    })
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch {
      return false
    }
  }, [])

  // Add a reminder time
  const addReminderTime = useCallback((time: string) => {
    setSettings((prev) => {
      if (prev.times.includes(time)) return prev
      const newTimes = [...prev.times, time].sort()
      const newSettings = { ...prev, times: newTimes }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      } catch {
        // Storage full
      }
      return newSettings
    })
  }, [])

  // Remove a reminder time
  const removeReminderTime = useCallback((time: string) => {
    setSettings((prev) => {
      const newTimes = prev.times.filter((t) => t !== time)
      const newSettings = { ...prev, times: newTimes }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      } catch {
        // Storage full
      }
      return newSettings
    })
  }, [])

  // Send a test notification via service worker, with fallback for dev
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (permission !== 'granted') return false

    const options = {
      body: "This is a test notification. Don't forget to log your attendance!",
      icon: '/icon-192.png',
      tag: `daydesk-test-${Date.now()}`,
    }

    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      if (registration?.active) {
        await registration.showNotification('Daydesk Reminder', options)
      } else {
        new Notification('Daydesk Reminder', options)
      }
      return true
    } catch (error) {
      console.error('Failed to send notification:', error)
      return false
    }
  }, [permission])

  return {
    permission,
    settings,
    isLoaded,
    updateSettings,
    requestPermission,
    addReminderTime,
    removeReminderTime,
    sendTestNotification,
  }
}
