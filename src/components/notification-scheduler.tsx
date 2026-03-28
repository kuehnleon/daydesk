'use client'

import { useEffect, useRef } from 'react'

const OLD_SETTINGS_KEY = 'daydesk-reminder-settings'
const OLD_LAST_SHOWN_KEY = 'daydesk-reminder-last-shown'

/**
 * Migration bridge: moves any existing localStorage reminder settings
 * to the server-backed storage and cleans up the old keys.
 * Can be removed in a future release once all users have migrated.
 */
export function NotificationScheduler() {
  const migrated = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || migrated.current) return
    migrated.current = true

    const stored = localStorage.getItem(OLD_SETTINGS_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as { enabled?: boolean; times?: string[]; workDaysOnly?: boolean }

      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderEnabled: parsed.enabled ?? false,
          reminderTimes: (parsed.times ?? []).join(','),
          reminderWorkDaysOnly: parsed.workDaysOnly ?? true,
        }),
      }).then(() => {
        localStorage.removeItem(OLD_SETTINGS_KEY)
        localStorage.removeItem(OLD_LAST_SHOWN_KEY)
      }).catch(() => {
        // Retry on next page load
      })
    } catch {
      // Invalid JSON — clean it up
      localStorage.removeItem(OLD_SETTINGS_KEY)
      localStorage.removeItem(OLD_LAST_SHOWN_KEY)
    }
  }, [])

  return null
}
