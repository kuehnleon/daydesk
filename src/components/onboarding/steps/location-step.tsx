'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/toast'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { hapticSuccess } from '@/lib/haptic'
import { COLOR_OPTIONS } from '@/hooks/useLocationSettings'
import type { Transport, Location } from '@/types'

interface LocationStepProps {
  transports: Transport[]
  locations: Location[]
  setLocations: (locations: Location[]) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function LocationStep({
  transports,
  locations,
  setLocations,
  onNext,
  onBack,
  onSkip,
}: LocationStepProps) {
  const t = useTranslations('onboarding')
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [name, setName] = useState('')
  const [transportId, setTransportId] = useState('')
  const [distance, setDistance] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [isAdding, setIsAdding] = useState(false)

  const resetForm = () => {
    setName('')
    setTransportId('')
    setDistance('')
    // Cycle to next color for convenience
    const currentIndex = COLOR_OPTIONS.indexOf(color)
    setColor(COLOR_OPTIONS[(currentIndex + 1) % COLOR_OPTIONS.length])
  }

  const handleAdd = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      showToast(t('nameRequired'), 'error')
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          transportId: transportId || null,
          distance: distance || null,
          color,
        }),
      })
      if (response.ok) {
        const created = await response.json()
        setLocations([...locations, created])
        resetForm()
        hapticSuccess()
        showToast(t('locationAdded'), 'success')
      }
    } finally {
      setIsAdding(false)
    }
  }

  const checkUnsaved = async (): Promise<boolean> => {
    if (!name.trim()) return true
    return confirm({
      message: t('unsavedLocation', { name: name.trim() }),
      confirmLabel: t('discard'),
      cancelLabel: t('goBackAndAdd'),
    })
  }

  const handleNext = async () => {
    if (await checkUnsaved()) onNext()
  }

  const handleBack = async () => {
    if (await checkUnsaved()) onBack()
  }

  const handleSkip = async () => {
    if (await checkUnsaved()) onSkip()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
        {t('locationTitle')}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        {t('locationDescription')}
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t('locationName')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('locationPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t('defaultTransport')}
          </label>
          <select
            value={transportId}
            onChange={(e) => setTransportId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
          >
            <option value="">{t('none')}</option>
            {transports.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t('distance')}
          </label>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder={t('distancePlaceholder')}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            {t('color')}
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-lg transition-transform ${
                  color === c
                    ? 'scale-110 ring-2 ring-offset-2 ring-accent'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {t('addLocation')}
        </button>
      </div>

      {locations.length > 0 && (
        <div className="mt-4 space-y-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
            >
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: loc.color }}
              />
              <span className="font-medium text-text-primary">{loc.name}</span>
              {loc.transport && (
                <span className="text-sm text-text-secondary">({loc.transport.name})</span>
              )}
              {loc.distance && (
                <span className="text-sm text-text-secondary">{loc.distance} km</span>
              )}
            </div>
          ))}
        </div>
      )}

      {locations.length === 0 && (
        <p className="mt-4 text-center text-sm text-text-tertiary py-2">
          {t('noLocationsYet')}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <button
          onClick={handleBack}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          {t('back')}
        </button>
        <button
          onClick={handleNext}
          disabled={locations.length === 0}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {t('next')}
        </button>
      </div>
      <button
        onClick={handleSkip}
        className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium text-text-tertiary transition-colors hover:text-text-secondary"
      >
        {t('skip')}
      </button>
    </div>
  )
}
