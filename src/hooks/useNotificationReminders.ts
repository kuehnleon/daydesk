'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { urlBase64ToUint8Array } from '@/lib/push-utils'
import type { ReminderSettings, ReminderTimeEntry } from '@/types'

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
        const json = existing.toJSON()
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: {
              p256dh: json.keys!.p256dh,
              auth: json.keys!.auth,
            },
          }),
        })
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKeyRef.current) as BufferSource,
      })

      const subJson = subscription.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys!.p256dh,
            auth: subJson.keys!.auth,
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
            times: data.reminders ?? [],
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

  // Persist toggle settings to server (enabled / workDaysOnly only)
  const patchSettings = useCallback(async (reminderEnabled: boolean, reminderWorkDaysOnly: boolean) => {
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderEnabled, reminderWorkDaysOnly }),
      })
    } catch {
      // Silently fail — local state already updated
    }
  }, [])

  const updateSettings = useCallback((updates: Partial<ReminderSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates }
      patchSettings(newSettings.enabled, newSettings.workDaysOnly)
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

  const addReminderTime = useCallback(async (time: string) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time, timezone }),
      })
      if (!res.ok) return

      const entry: ReminderTimeEntry = await res.json()
      setSettings((prev) => ({
        ...prev,
        times: [...prev.times, entry].sort((a, b) => a.time.localeCompare(b.time)),
      }))
    } catch {
      // Failed to add reminder
    }
  }, [])

  const removeReminderTime = useCallback(async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      setSettings((prev) => ({
        ...prev,
        times: prev.times.filter((t) => t.id !== id),
      }))
    } catch {
      // Failed to remove reminder
    }
  }, [])

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
