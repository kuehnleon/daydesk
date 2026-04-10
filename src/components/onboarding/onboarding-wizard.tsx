'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { WelcomeStep } from './steps/welcome-step'
import { CountryStep } from './steps/country-step'
import { TransportStep } from './steps/transport-step'
import { LocationStep } from './steps/location-step'
import { CompleteStep } from './steps/complete-step'
import { Skeleton } from '@/components/ui/skeleton'
import type { Transport, Location } from '@/types'

const TOTAL_STEPS = 5

export function OnboardingWizard() {
  const router = useRouter()
  const t = useTranslations('onboarding')
  const [currentStep, setCurrentStep] = useState(0)
  const [isChecking, setIsChecking] = useState(true)

  // Wizard data
  const [country, setCountry] = useState('DE')
  const [defaultState, setDefaultState] = useState('BW')
  const [transports, setTransports] = useState<Transport[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const [settingsRes, transportsRes, locationsRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/transports'),
          fetch('/api/locations'),
        ])

        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          if (settings.onboardingCompleted) {
            router.push('/dashboard')
            return
          }
          setCountry(settings.country ?? 'DE')
          setDefaultState(settings.defaultState ?? 'BW')
        }

        if (transportsRes.ok) {
          setTransports(await transportsRes.json())
        }
        if (locationsRes.ok) {
          setLocations(await locationsRes.json())
        }
      } finally {
        setIsChecking(false)
      }
    }

    checkOnboarding()
  }, [router])

  const handleSkip = async () => {
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCompleted: true }),
      })
    } finally {
      router.push('/dashboard')
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-[var(--sai-left)] pr-[var(--sai-right)] pt-[var(--sai-top)] pb-[var(--sai-bottom)]">
        <div className="mx-4 w-full max-w-lg">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="mt-4 h-11 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-[var(--sai-left)] pr-[var(--sai-right)] pt-[var(--sai-top)] pb-[var(--sai-bottom)]">
      <div className="mx-4 w-full max-w-lg">
        {/* Progress dots */}
        {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
          <div className="mb-4 flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === currentStep
                    ? 'bg-accent'
                    : i < currentStep
                      ? 'bg-accent/50'
                      : 'bg-surface-secondary border border-border'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step indicator text */}
        {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
          <p className="mb-2 text-center text-xs text-text-tertiary">
            {t('step', { current: currentStep, total: TOTAL_STEPS - 2 })}
          </p>
        )}

        <div className="card p-6 sm:p-8">
          {currentStep === 0 && (
            <WelcomeStep
              onNext={() => setCurrentStep(1)}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 1 && (
            <CountryStep
              country={country}
              defaultState={defaultState}
              setCountry={setCountry}
              setDefaultState={setDefaultState}
              onNext={() => setCurrentStep(2)}
              onBack={() => setCurrentStep(0)}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 2 && (
            <TransportStep
              transports={transports}
              setTransports={setTransports}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 3 && (
            <LocationStep
              transports={transports}
              locations={locations}
              setLocations={setLocations}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 4 && (
            <CompleteStep
              transportCount={transports.length}
              locationCount={locations.length}
            />
          )}
        </div>
      </div>
    </div>
  )
}
