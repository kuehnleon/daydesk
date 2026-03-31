'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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

  const t = useTranslations('reminders')
  const { showToast } = useToast()
  const [newTime, setNewTime] = useState('09:00')

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      showToast(t('notificationsEnabled'), 'success')
    } else {
      showToast(t('permissionDenied'), 'error')
    }
  }

  const handleAddTime = () => {
    if (settings.times.some(entry => entry.time === newTime)) {
      showToast(t('timeAlreadyAdded'), 'error')
      return
    }
    addReminderTime(newTime)
    showToast(t('reminderAdded', { time: newTime }), 'success')
  }

  const handleRemoveTime = (id: string) => {
    removeReminderTime(id)
  }

  const handleTest = async () => {
    const success = await sendTestNotification()
    if (success) {
      showToast(t('testSent'), 'info')
    } else {
      showToast(t('testFailed'), 'error')
    }
  }

  if (!isLoaded) {
    return (
      <div className="card p-4 sm:p-8">
        <p className="text-sm text-text-tertiary">{t('loading')}</p>
      </div>
    )
  }

  if (permission === 'unsupported') {
    return (
      <div className="card p-4 sm:p-8">
        <div className="flex items-center gap-2">
          <BellOff className="h-5 w-5 text-text-tertiary" />
          <h3 className="text-lg font-semibold text-text-primary">
            {t('title')}
          </h3>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          {t('unsupported')}
        </p>
      </div>
    )
  }

  return (
    <div className="card p-4 sm:p-8">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-text-primary">
          {t('title')}
        </h3>
      </div>

      {/* Permission Status */}
      {permission === 'default' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/20">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {t('permissionRequired')}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('permissionHint')}
            </p>
          </div>
          <button
            onClick={handleRequestPermission}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            {t('enable')}
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
          <BellOff className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {t('blocked')}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              {t('blockedHint')}
            </p>
          </div>
        </div>
      )}

      {permission === 'granted' && (
        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{t('enabled')}</span>
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
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent disabled:opacity-50"
          />
          <span className="text-sm font-medium text-text-secondary">
            {t('enableDaily')}
          </span>
        </label>
      </div>

      {/* Reminder Times */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          {t('reminderTimes')}
        </label>

        {settings.times.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {settings.times.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-1.5"
              >
                <span className="font-mono text-sm text-text-primary">
                  {entry.time}
                </span>
                <button
                  onClick={() => handleRemoveTime(entry.id)}
                  className="rounded p-0.5 text-text-tertiary hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-3 text-sm text-text-tertiary">
            {t('noTimes')}
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-foreground focus:border-accent focus:ring-accent"
          />
          <button
            onClick={handleAddTime}
            disabled={permission !== 'granted'}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
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
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent disabled:opacity-50"
          />
          <span className="text-sm font-medium text-text-secondary">
            {t('onlyWorkDays')}
          </span>
        </label>
        <p className="ml-7 text-xs text-text-tertiary">
          {t('workDaysHint')}
        </p>
      </div>

      {/* Test Button */}
      {permission === 'granted' && (
        <button
          onClick={handleTest}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-foreground"
        >
          {t('sendTest')}
        </button>
      )}
    </div>
  )
}
