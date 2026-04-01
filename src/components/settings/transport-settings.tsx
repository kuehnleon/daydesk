'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransportSettings } from '@/hooks/useTransportSettings'

interface TransportSettingsProps {
  onDataChange?: () => void
  onReady?: () => void
}

export function TransportSettings({ onDataChange, onReady }: TransportSettingsProps) {
  const {
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
  } = useTransportSettings(onDataChange)

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
          <h3 className="text-lg font-semibold text-text-primary">{t('transportMethods')}</h3>
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
          </div>
        ) : transports.length === 0 ? (
          <p className="text-sm text-text-secondary">
            {t('noTransportMethods')}
          </p>
        ) : (
          <div className="space-y-2">
            {transports.map((transport) => (
              <div
                key={transport.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2"
              >
                <GripVertical className="h-4 w-4 text-text-tertiary" />
                <span className="flex-1 font-medium text-text-primary">
                  {transport.name}
                </span>
                <button
                  onClick={() => openEdit(transport)}
                  className="rounded p-1 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(transport.id)}
                  className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 my-[calc(1rem+var(--sai-top))] max-h-[calc(100dvh-2rem-var(--sai-top)-var(--sai-bottom))] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-overlay">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {editing ? t('editTransport') : t('addTransport')}
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
                  placeholder={t('transportPlaceholder')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
                />
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
