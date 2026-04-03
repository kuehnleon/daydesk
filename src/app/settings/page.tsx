'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Navbar } from '@/components/navbar'
import { TransportSettings } from '@/components/settings/transport-settings'
import { LocationSettings } from '@/components/settings/location-settings'
import { ReminderSettings } from '@/components/settings/reminder-settings'
import { GeneralSettings } from '@/components/settings/general-settings'
import { Skeleton } from '@/components/ui/skeleton'

const SECTION_COUNT = 4

function parseDashboardHidden(raw: string): Set<string> {
  if (!raw) return new Set()
  return new Set(raw.split(',').filter(Boolean))
}

export default function Settings() {
  const t = useTranslations('settings')
  const [locationKey, setLocationKey] = useState(0)
  const [readyCount, setReadyCount] = useState(0)
  const [dashboardHidden, setDashboardHidden] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.dashboardHidden !== undefined) {
          setDashboardHidden(parseDashboardHidden(data.dashboardHidden))
        }
      })
      .catch(() => {})
  }, [])

  const toggleVisibility = useCallback((id: string) => {
    setDashboardHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      const raw = Array.from(next).join(',')
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardHidden: raw }),
      })
      return next
    })
  }, [])

  const onSectionReady = useCallback(() => {
    setReadyCount((c) => c + 1)
  }, [])

  const allReady = readyCount >= SECTION_COUNT

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-6 pb-[calc(1.5rem+var(--sai-bottom))] sm:py-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-text-primary sm:mb-8 sm:text-3xl">{t('title')}</h2>

        {!allReady && <SettingsSkeleton />}

        <div className={allReady ? undefined : 'invisible absolute'}>
          <TransportSettings onDataChange={() => setLocationKey(k => k + 1)} onReady={onSectionReady} />
          <LocationSettings key={locationKey} onReady={onSectionReady} dashboardHidden={dashboardHidden} onToggleVisibility={toggleVisibility} />

          <div className="mb-6">
            <ReminderSettings onReady={onSectionReady} />
          </div>

          <GeneralSettings onReady={onSectionReady} />
        </div>

        <p className="mt-6 text-center text-xs text-text-tertiary">
          daydesk v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </main>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Transport skeleton */}
      <div className="card p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>

      {/* Location skeleton */}
      <div className="card p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>

      {/* Reminder skeleton */}
      <div className="card p-4 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="mb-4 h-10 rounded-lg" />
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      {/* General skeleton */}
      <div className="card p-4 sm:p-8 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  )
}
