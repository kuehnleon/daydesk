'use client'

import { useState } from 'react'
import { Bell, BellOff, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNotificationReminders } from '@/hooks/useNotificationReminders'
import { useToast } from '@/components/ui/toast'

export function ReminderSettings() {
  const {
    permission,
    settings,
    isLoaded,
    updateSettings,
    requestPermission,
    addReminderTime,
    removeReminderTime,
    sendTestNotification,
  } = useNotificationReminders()

  const { showToast } = useToast()
  const [newTime, setNewTime] = useState('09:00')

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      showToast('Notifications enabled!', 'success')
    } else {
      showToast('Permission denied. Enable in browser settings.', 'error')
    }
  }

  const handleAddTime = () => {
    if (settings.times.some(t => t.time === newTime)) {
      showToast('This time is already added', 'error')
      return
    }
    addReminderTime(newTime)
    showToast(`Reminder added for ${newTime}`, 'success')
  }

  const handleRemoveTime = (id: string) => {
    removeReminderTime(id)
  }

  const handleTest = async () => {
    const success = await sendTestNotification()
    if (success) {
      showToast('Test notification sent!', 'info')
    } else {
      showToast('Failed to send notification. Check browser and system notification settings.', 'error')
    }
  }

  if (!isLoaded) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (permission === 'unsupported') {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <BellOff className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reminder Notifications
          </h3>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Notifications are not supported in this browser.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reminder Notifications
        </h3>
      </div>

      {/* Permission Status */}
      {permission === 'default' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/20">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Permission required
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Allow notifications to receive attendance reminders
            </p>
          </div>
          <button
            onClick={handleRequestPermission}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Enable
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
          <BellOff className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Notifications blocked
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Please enable notifications in your browser settings
            </p>
          </div>
        </div>
      )}

      {permission === 'granted' && (
        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Notifications enabled</span>
        </div>
      )}

      {/* Enable Toggle */}
      <div className="mb-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => updateSettings({ enabled: e.target.checked })}
            disabled={permission !== 'granted'}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable daily reminders
          </span>
        </label>
      </div>

      {/* Reminder Times */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reminder Times
        </label>

        {settings.times.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {settings.times.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-700/50"
              >
                <span className="font-mono text-sm text-gray-900 dark:text-white">
                  {entry.time}
                </span>
                <button
                  onClick={() => handleRemoveTime(entry.id)}
                  className="rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            No reminder times configured
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleAddTime}
            disabled={permission !== 'granted'}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Work Days Only */}
      <div className="mb-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={settings.workDaysOnly}
            onChange={(e) => updateSettings({ workDaysOnly: e.target.checked })}
            disabled={permission !== 'granted'}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Only on work days
          </span>
        </label>
        <p className="ml-7 text-xs text-gray-500 dark:text-gray-400">
          Respects your configured work days in settings below
        </p>
      </div>

      {/* Test Button */}
      {permission === 'granted' && (
        <button
          onClick={handleTest}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Send Test Notification
        </button>
      )}
    </div>
  )
}
