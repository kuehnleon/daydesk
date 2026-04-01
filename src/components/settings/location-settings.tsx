'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocationSettings, COLOR_OPTIONS } from '@/hooks/useLocationSettings'

interface LocationSettingsProps {
  onReady?: () => void
}

export function LocationSettings({ onReady }: LocationSettingsProps) {
  const {
    locations,
    transports,
    isLoading,
    showModal,
    setShowModal,
    editing,
    form,
    setForm,
    openAdd,
    openEdit,
    save,
    remove,
  } = useLocationSettings()

  const t = useTranslations('settings')
  const onReadyRef = useRef(onReady)
  const calledRef = useRef(false)

  useEffect(() => {
    if (!isLoading && !calledRef.current) {
      calledRef.current = true
      onReadyRef.current?.()
    }
  }, [isLoading])

  return (
    <>
      <div className="mb-6 card p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">{t('yourLocations')}</h3>
          <button
            onClick={openAdd}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            {t('add')}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
              >
                <GripVertical className="h-4 w-4 text-text-tertiary" />
                <div
                  className="h-4 w-4 rounded"
                  style={{ backgroundColor: location.color }}
                />
                <span className="flex-1 font-medium text-text-primary">
                  {location.name}
                </span>
                <span className="text-sm text-text-secondary">
                  {location.transport?.name || t('noTransport')}
                </span>
                {location.distance && (
                  <span className="text-sm text-text-secondary">
                    {location.distance} km
                  </span>
                )}
                <button
                  onClick={() => openEdit(location)}
                  className="rounded p-1 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(location.id)}
                  className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Built-in Home Office */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2">
              <GripVertical className="h-4 w-4 text-text-tertiary" />
              <div className="h-4 w-4 rounded bg-emerald-500" />
              <span className="flex-1 font-medium text-text-primary">
                {t('homeOffice')}
              </span>
              <span className="text-xs text-text-tertiary">
                {t('builtIn')}
              </span>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 my-[calc(1rem+var(--sai-top))] max-h-[calc(100dvh-2rem-var(--sai-top)-var(--sai-bottom))] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-overlay">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {editing ? t('editLocation') : t('addLocation')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('locationPlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('defaultTransport')}
                </label>
                <select
                  value={form.transportId}
                  onChange={(e) => setForm({ ...form, transportId: e.target.value })}
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
                  value={form.distance}
                  onChange={(e) => setForm({ ...form, distance: e.target.value })}
                  placeholder={t('distancePlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  {t('distanceHelp')}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  {t('color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      className={`h-8 w-8 rounded-lg transition-transform ${
                        form.color === color
                          ? 'scale-110 ring-2 ring-offset-2 ring-accent'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                {t('cancel')}
              </button>
              <button
                onClick={save}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                {editing ? t('save') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
