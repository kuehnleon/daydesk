'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Navbar } from '@/components/navbar'
import { TransportSettings } from '@/components/settings/transport-settings'
import { LocationSettings } from '@/components/settings/location-settings'
import { ReminderSettings } from '@/components/settings/reminder-settings'
import { GeneralSettings } from '@/components/settings/general-settings'

export default function Settings() {
  const t = useTranslations('settings')
  const [locationKey, setLocationKey] = useState(0)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-6 pb-[calc(1.5rem+var(--sai-bottom))] sm:py-12 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-text-primary sm:mb-8 sm:text-3xl">{t('title')}</h2>

        <TransportSettings onDataChange={() => setLocationKey(k => k + 1)} />
        <LocationSettings key={locationKey} />

        <div className="mb-6">
          <ReminderSettings />
        </div>

        <GeneralSettings />

        <p className="mt-6 text-center text-xs text-text-tertiary">
          daydesk v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </main>
    </div>
  )
}
