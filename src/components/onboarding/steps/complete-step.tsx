'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { CircleCheck } from 'lucide-react'

interface CompleteStepProps {
  transportCount: number
  locationCount: number
}

export function CompleteStep({ transportCount, locationCount }: CompleteStepProps) {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const [isFinishing, setIsFinishing] = useState(false)

  const handleFinish = async () => {
    setIsFinishing(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCompleted: true }),
      })
      router.push('/dashboard')
    } catch {
      setIsFinishing(false)
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <CircleCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>

      <h2 className="mt-6 text-xl font-semibold text-text-primary sm:text-2xl">
        {t('completeTitle')}
      </h2>
      <p className="mt-3 text-sm text-text-secondary max-w-xs">
        {transportCount > 0
          ? t('completeDescription', { locations: locationCount, transports: transportCount })
          : t('completeDescriptionNoTransports', { locations: locationCount })
        }
      </p>

      <button
        onClick={handleFinish}
        disabled={isFinishing}
        className="mt-8 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {t('goToDashboard')}
      </button>
    </div>
  )
}
