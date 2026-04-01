'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useTranslations, useLocale } from 'next-intl'
import { getDateFnsLocale } from '@/lib/date-locale'
import {
  Building2,
  Home,
  Car,
  Palmtree,
  ThermometerSun,
  ChevronRight,
  X,
} from 'lucide-react'
import type { Location, Transport, CalendarAttendance } from '@/types'

interface AttendanceModalProps {
  selectedDates: Set<string>
  attendances: Record<string, CalendarAttendance>
  locations: Location[]
  transports: Transport[]
  isLoading: boolean
  onSave: (type: string, transportId: string | null, locationId?: string | null) => Promise<void>
  onClear: () => Promise<void>
  onClose: () => void
}

export function AttendanceModal({
  selectedDates,
  attendances,
  locations,
  transports,
  isLoading,
  onSave,
  onClear,
  onClose,
}: AttendanceModalProps) {
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null)
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(null)
  const t = useTranslations('calendar')
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  const getSelectedDatesArray = (): string[] => {
    return Array.from(selectedDates).sort()
  }

  const hasExistingAttendance = (): boolean => {
    return getSelectedDatesArray().some(dateStr => attendances[dateStr])
  }

  const getModalTitle = () => {
    const dates = getSelectedDatesArray()
    if (dates.length === 1) {
      return format(new Date(dates[0]), 'EEEE, MMMM d, yyyy', { locale: dateFnsLocale })
    }
    return t('editDays', { count: dates.length })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 my-[calc(1rem+var(--sai-top))] max-h-[calc(100dvh-2rem-var(--sai-top)-var(--sai-bottom))] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold tracking-tight text-text-primary">
            {getModalTitle()}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3">
          {locations.map(location => {
            const isExpanded = expandedLocationId === location.id
            const hasTransports = transports.length > 0
            const dates = getSelectedDatesArray()
            const currentAttendance = dates.length === 1 ? attendances[dates[0]] : null
            const isSelected = currentAttendance?.locationId === location.id

            if (isExpanded) {
              return (
                <div
                  key={location.id}
                  className="overflow-hidden rounded-xl text-white shadow-lg"
                  style={{ backgroundColor: location.color }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/20 p-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-8 w-8" />
                      <div>
                        <div className="font-semibold">{location.name}</div>
                        <div className="text-sm opacity-80">{t('selectTransport')}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setExpandedLocationId(null)
                        setSelectedTransportId(null)
                      }}
                      className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/20"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Transport Options */}
                  <div className="p-3">
                    <div className="grid gap-2">
                      {transports.map(transport => {
                        const isTransportSelected = selectedTransportId === transport.id
                        const isDefault = transport.id === location.transportId
                        return (
                          <button
                            key={transport.id}
                            onClick={() => setSelectedTransportId(transport.id)}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                              isTransportSelected
                                ? 'bg-white/25 ring-2 ring-white/50'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                              isTransportSelected ? 'border-white bg-white' : 'border-white/60'
                            }`}>
                              {isTransportSelected && (
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: location.color }} />
                              )}
                            </div>
                            <span className="flex-1 font-medium">{transport.name}</span>
                            {isDefault && (
                              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{t('default')}</span>
                            )}
                          </button>
                        )
                      })}
                      {/* No transport option */}
                      <button
                        onClick={() => setSelectedTransportId(null)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                          selectedTransportId === null
                            ? 'bg-white/25 ring-2 ring-white/50'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          selectedTransportId === null ? 'border-white bg-white' : 'border-white/60'
                        }`}>
                          {selectedTransportId === null && (
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: location.color }} />
                          )}
                        </div>
                        <span className="flex-1 font-medium">{t('noTransport')}</span>
                        {!location.transportId && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{t('default')}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="border-t border-white/20 p-3">
                    <button
                      onClick={() => onSave('office', selectedTransportId, location.id)}
                      disabled={isLoading}
                      className="w-full cursor-pointer rounded-lg bg-white py-2.5 font-semibold transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ color: location.color }}
                    >
                      {t('save')}
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={location.id}
                className="relative flex items-center rounded-xl text-white transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: location.color,
                  boxShadow: isSelected
                    ? `0 0 0 3px white, 0 0 0 5px ${location.color}`
                    : undefined,
                }}
              >
                <button
                  onClick={() => {
                    const dates = getSelectedDatesArray()
                    const existing = dates.length === 1 ? attendances[dates[0]] : null
                    const transportId =
                      existing?.locationId === location.id
                        ? existing.transportId
                        : location.transportId
                    onSave('office', transportId, location.id)
                  }}
                  disabled={isLoading}
                  className="flex flex-1 cursor-pointer items-center gap-4 p-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Building2 className="h-10 w-10" />
                  <div>
                    <div className="font-semibold">{location.name}</div>
                    {(() => {
                      const dates = getSelectedDatesArray()
                      const existing = dates.length === 1 ? attendances[dates[0]] : null
                      const hasOverride =
                        existing?.locationId === location.id &&
                        existing?.transportId !== location.transportId
                      const overrideTransport = hasOverride ? existing?.transport : null

                      if (hasOverride && overrideTransport) {
                        return (
                          <div className="text-sm opacity-90">
                            {location.transport && (
                              <span className="line-through opacity-60">
                                {location.transport.name}
                              </span>
                            )}{' '}
                            {overrideTransport.name}
                          </div>
                        )
                      }
                      if (hasOverride && !existing?.transportId) {
                        return location.transport ? (
                          <div className="text-sm opacity-90">
                            <span className="line-through opacity-60">
                              {location.transport.name}
                            </span>
                          </div>
                        ) : null
                      }
                      return location.transport ? (
                        <div className="text-sm opacity-90">{location.transport.name}</div>
                      ) : null
                    })()}
                    {location.distance && Number(location.distance) > 0 && (
                      <div className="text-xs opacity-75">{location.distance} km</div>
                    )}
                  </div>
                </button>
                {hasTransports && (
                  <button
                    onClick={() => {
                      setExpandedLocationId(location.id)
                      const dates = getSelectedDatesArray()
                      if (dates.length === 1) {
                        const existing = attendances[dates[0]]
                        if (existing?.locationId === location.id) {
                          setSelectedTransportId(existing.transportId)
                          return
                        }
                      }
                      setSelectedTransportId(location.transportId)
                    }}
                    disabled={isLoading}
                    className="mr-3 flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                    title={t('changeTransport')}
                  >
                    <Car className="h-4 w-4" />
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}

          {(() => {
            const dates = getSelectedDatesArray()
            const currentAttendance = dates.length === 1 ? attendances[dates[0]] : null
            const isHome = currentAttendance?.type === 'home'
            const isOff = currentAttendance?.type === 'off'
            const isSick = currentAttendance?.type === 'sick'
            return (
              <>
                <button
                  onClick={() => onSave('home', null)}
                  disabled={isLoading}
                  className={`relative flex cursor-pointer items-center gap-4 rounded-xl bg-emerald-500 p-4 text-left text-white transition-all hover:scale-[1.02] hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isHome ? 'ring-3 ring-emerald-300 ring-offset-2 dark:ring-emerald-400 dark:ring-offset-background' : ''
                  }`}
                >
                  <Home className="h-10 w-10" />
                  <div>
                    <div className="font-semibold">{t('homeOffice')}</div>
                  </div>
                </button>

                <button
                  onClick={() => onSave('off', null)}
                  disabled={isLoading}
                  className={`relative flex cursor-pointer items-center gap-4 rounded-xl bg-amber-500 p-4 text-left text-white transition-all hover:scale-[1.02] hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isOff ? 'ring-3 ring-amber-300 ring-offset-2 dark:ring-amber-400 dark:ring-offset-background' : ''
                  }`}
                >
                  <Palmtree className="h-10 w-10" />
                  <div>
                    <div className="font-semibold">{t('dayOff')}</div>
                  </div>
                </button>

                <button
                  onClick={() => onSave('sick', null)}
                  disabled={isLoading}
                  className={`relative flex cursor-pointer items-center gap-4 rounded-xl bg-red-500 p-4 text-left text-white transition-all hover:scale-[1.02] hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSick ? 'ring-3 ring-red-300 ring-offset-2 dark:ring-red-400 dark:ring-offset-background' : ''
                  }`}
                >
                  <ThermometerSun className="h-10 w-10" />
                  <div>
                    <div className="font-semibold">{t('sick')}</div>
                  </div>
                </button>
              </>
            )
          })()}
        </div>

        {hasExistingAttendance() && (
          <button
            onClick={onClear}
            disabled={isLoading}
            className="mt-4 w-full cursor-pointer rounded-xl border-2 border-red-300 bg-red-50 p-3 text-red-700 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            {selectedDates.size > 1 ? t('clearAllEntries') : t('clearEntry')}
          </button>
        )}
      </div>
    </div>
  )
}
