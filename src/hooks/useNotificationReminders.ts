'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { urlBase64ToUint8Array } from '@/lib/push-utils'
import type { ReminderSettings } from '@/types'

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
  const vapidKeyRef = useRef<string | null>(null)

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!vapidKeyRef.current) return

    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      if (!registration) return

      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        // Already subscribed, ensure server knows
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: existing.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(existing.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(existing.getKey('auth')!))),
            },
          }),
        })
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKeyRef.current) as BufferSource,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
        }),
      })
    } catch {
      // Push subscription failed — notifications will only work in-browser
    }
  }, [])

  // Load settings from server and check push state
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!('Notification' in window)) {
      setPermission('unsupported') // eslint-disable-line react-hooks/set-state-in-effect -- initializing from browser API
      setIsLoaded(true)
      return
    }

    setPermission(Notification.permission)

    const load = async () => {
      try {
        const [settingsRes, vapidRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/push/vapid-key'),
        ])

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings({
            enabled: data.reminderEnabled ?? false,
            times: data.reminderTimes ? data.reminderTimes.split(',').filter(Boolean) : [],
            workDaysOnly: data.reminderWorkDaysOnly ?? true,
          })
        }

        if (vapidRes.ok) {
          const data = await vapidRes.json()
          vapidKeyRef.current = data.publicKey

          // If permission was already granted (e.g. from before the migration),
          // ensure the push subscription is registered on the server
          if (Notification.permission === 'granted') {
            await subscribeToPush()
          }
        }
      } catch {
        // Use defaults on error
      }
      setIsLoaded(true)
    }

    load()
  }, [subscribeToPush])

  // Persist settings to server
  const patchSettings = useCallback(async (reminderEnabled: boolean, reminderTimes: string, reminderWorkDaysOnly: boolean) => {
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderEnabled, reminderTimes, reminderWorkDaysOnly }),
      })
    } catch {
      // Silently fail — local state already updated
    }
  }, [])

  const updateSettings = useCallback((updates: Partial<ReminderSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates }
      patchSettings(newSettings.enabled, newSettings.times.join(','), newSettings.workDaysOnly)
      return newSettings
    })
  }, [patchSettings])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        await subscribeToPush()
      }

      return result === 'granted'
    } catch {
      return false
    }
  }, [subscribeToPush])

  const addReminderTime = useCallback((time: string) => {
    setSettings((prev) => {
      if (prev.times.includes(time)) return prev
      const newTimes = [...prev.times, time].sort()
      const newSettings = { ...prev, times: newTimes }
      patchSettings(newSettings.enabled, newSettings.times.join(','), newSettings.workDaysOnly)
      return newSettings
    })
  }, [patchSettings])

  const removeReminderTime = useCallback((time: string) => {
    setSettings((prev) => {
      const newTimes = prev.times.filter((t) => t !== time)
      const newSettings = { ...prev, times: newTimes }
      patchSettings(newSettings.enabled, newSettings.times.join(','), newSettings.workDaysOnly)
      return newSettings
    })
  }, [patchSettings])

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
