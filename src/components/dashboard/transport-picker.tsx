'use client'

/**
 * Coloured transport-picker block. Renders one radio-style option per
 * transport plus a "No transport" option, marking whichever matches the
 * location's default. Used inside modals that already know which
 * location is being edited.
 *
 * Extracted from the calendar `AttendanceModal` so the dashboard's
 * card-action modal can reuse the same UX without duplicating markup.
 */
import type { Location, Transport } from '@/types'
import { useTranslations } from 'next-intl'

interface TransportPickerProps {
  location: Location
  transports: Transport[]
  selectedTransportId: string | null
  onSelect: (transportId: string | null) => void
}

export function TransportPicker({
  location,
  transports,
  selectedTransportId,
  onSelect,
}: TransportPickerProps) {
  const t = useTranslations('calendar')

  return (
    <div className="grid gap-2">
      {transports.map(transport => {
        const isSelected = selectedTransportId === transport.id
        const isDefault = transport.id === location.transportId
        return (
          <button
            key={transport.id}
            type="button"
            onClick={() => onSelect(transport.id)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
              isSelected
                ? 'bg-white/25 ring-2 ring-white/50'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                isSelected ? 'border-white bg-white' : 'border-white/60'
              }`}
            >
              {isSelected && (
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: location.color }}
                />
              )}
            </div>
            <span className="flex-1 font-medium">{transport.name}</span>
            {isDefault && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {t('default')}
              </span>
            )}
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
          selectedTransportId === null
            ? 'bg-white/25 ring-2 ring-white/50'
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            selectedTransportId === null ? 'border-white bg-white' : 'border-white/60'
          }`}
        >
          {selectedTransportId === null && (
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: location.color }}
            />
          )}
        </div>
        <span className="flex-1 font-medium">{t('noTransport')}</span>
        {!location.transportId && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {t('default')}
          </span>
        )}
      </button>
    </div>
  )
}
