'use client'

import { useTranslations } from 'next-intl'

interface WelcomeStepProps {
  onNext: () => void
  onSkip: () => void
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  const t = useTranslations('onboarding')

  return (
    <div className="flex flex-col items-center text-center">
      <svg width="48" height="48" viewBox="0 0 88 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent" aria-hidden="true">
        <rect x="4" y="16" width="80" height="76" rx="14" fill="currentColor"/>
        <rect x="14" y="36" width="60" height="46" rx="6" fill="var(--surface, #fff)"/>
        <rect x="24" y="4" width="12" height="24" rx="4" fill="currentColor"/>
        <rect x="52" y="4" width="12" height="24" rx="4" fill="currentColor"/>
        <circle cx="32" cy="51" r="4" fill="currentColor" opacity="0.2"/>
        <circle cx="52" cy="51" r="4" fill="currentColor" opacity="0.2"/>
        <circle cx="32" cy="68" r="4" fill="currentColor" opacity="0.2"/>
        <circle cx="52" cy="68" r="5.5" fill="currentColor"/>
      </svg>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
        {t('welcome')}
      </h1>
      <p className="mt-3 text-sm text-text-secondary max-w-xs">
        {t('welcomeDescription')}
      </p>

      <div className="mt-8 w-full space-y-3">
        <button
          onClick={onNext}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {t('getStarted')}
        </button>
        <button
          onClick={onSkip}
          className="w-full rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          {t('skipSetup')}
        </button>
      </div>
    </div>
  )
}
