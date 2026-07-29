'use client'

/**
 * Focused per-card modal opened by long-pressing (or right-clicking) a
 * dashboard card. Lets the user override transport method (for office
 * cards) and add a note for today, without leaving the dashboard.
 *
 * A short click on the same card keeps the fast "log with defaults"
 * behaviour — this modal is the power path.
 */
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useTranslations, useLocale } from 'next-intl'
import {
  Building2,
  Home,
  Palmtree,
  ThermometerSun,
  X,
} from 'lucide-react'
import type { Location, Transport } from '@/types'
import { getDateFnsLocale } from '@/lib/date-locale'
import { TransportPicker } from './transport-picker'

export type CardTarget =
  | { kind: 'location'; location: Location; transports: Transport[] }
  | { kind: 'home' }
  | { kind: 'off' }
  | { kind: 'sick' }

interface CardActionModalProps {
  target: CardTarget
  /** Today's existing attendance (if any) — used to prefill selection. */
  existing: { transportId: string | null; notes: string | null; locationId: string | null; type: string } | null
  today: Date
  isLoading: boolean
  onSave: (transportId: string | null, notes: string | null) => Promise<void>
  onClose: () => void
}

function pickInitialTransport(target: CardTarget, existing: CardActionModalProps['existing']): string | null {
  if (target.kind !== 'location') return null
  // If today already logs this same location, keep whatever transport
  // was chosen (may be null). Otherwise fall back to the location's
  // default.
  if (existing && existing.locationId === target.location.id) {
    return existing.transportId
  }
  return target.location.transportId
}

function getCardMeta(target: CardTarget, t: (k: string) => string) {
  switch (target.kind) {
    case 'location':
      return { name: target.location.name, color: target.location.color, Icon: Building2 }
    case 'home':
      return { name: t('homeOffice'), color: '#10b981', Icon: Home } // emerald-500
    case 'off':
      return { name: t('dayOff'), color: '#f59e0b', Icon: Palmtree } // amber-500
    case 'sick':
      return { name: t('sick'), color: '#ef4444', Icon: ThermometerSun } // red-500
  }
}

export function CardActionModal({
  target,
  existing,
  today,
  isLoading,
  onSave,
  onClose,
}: CardActionModalProps) {
  const t = useTranslations('dashboard')
  const tCal = useTranslations('calendar')
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(
    pickInitialTransport(target, existing),
  )
  const [notes, setNotes] = useState<string>(existing?.notes ?? '')

  // Escape to close, matching ConfirmProvider convention.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const meta = getCardMeta(target, t)
  const Icon = meta.Icon
  const dateLabel = format(today, 'EEEE, MMMM d, yyyy', { locale: dateFnsLocale })

  const handleSave = () => {
    const trimmed = notes.trim()
    return onSave(selectedTransportId, trimmed || null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-action-modal-title"
        className="mx-4 my-[calc(1rem+var(--sai-top))] max-h-[calc(100dvh-2rem-var(--sai-top)-var(--sai-bottom))] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface shadow-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured card-style header */}
        <div
          className="flex items-center justify-between p-4 text-white"
          style={{ backgroundColor: meta.color }}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8" />
            <div>
              <h3
                id="card-action-modal-title"
                className="text-lg font-semibold"
              >
                {meta.name}
              </h3>
              <div className="text-sm opacity-80" suppressHydrationWarning>
                {dateLabel}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tCal('close')}
            className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {target.kind === 'location' && target.transports.length > 0 && (
            <>
              <div className="mb-3 text-sm font-medium text-text-secondary">
                {tCal('selectTransport')}
              </div>
              {/* TransportPicker's styling assumes a coloured backdrop
                  (bg-white/10, ring-white). Wrap in the location colour
                  so it visually matches the header. */}
              <div
                className="rounded-lg p-2 text-white"
                style={{ backgroundColor: meta.color }}
              >
                <TransportPicker
                  location={target.location}
                  transports={target.transports}
                  selectedTransportId={selectedTransportId}
                  onSelect={setSelectedTransportId}
                />
              </div>
            </>
          )}

          <div className={target.kind === 'location' && target.transports.length > 0 ? 'mt-4' : ''}>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="card-action-notes"
                className="text-sm text-text-secondary"
              >
                {tCal('note')}
              </label>
              <span className="text-xs text-text-tertiary">
                {tCal('noteCharCount', { count: notes.length })}
              </span>
            </div>
            <textarea
              id="card-action-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tCal('notePlaceholder')}
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="mt-4 w-full cursor-pointer rounded-lg py-2.5 font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: meta.color }}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
