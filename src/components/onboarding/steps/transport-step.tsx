'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/toast'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { hapticSuccess } from '@/lib/haptic'
import { Plus, X } from 'lucide-react'
import type { Transport } from '@/types'

interface TransportStepProps {
  transports: Transport[]
  setTransports: (transports: Transport[]) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function TransportStep({
  transports,
  setTransports,
  onNext,
  onBack,
  onSkip,
}: TransportStepProps) {
  const t = useTranslations('onboarding')
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [name, setName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const checkUnsaved = async (): Promise<boolean> => {
    if (!name.trim()) return true
    return confirm({
      message: t('unsavedTransport', { name: name.trim() }),
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

  const handleAdd = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      showToast(t('nameRequired'), 'error')
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch('/api/transports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (response.ok) {
        const created = await response.json()
        setTransports([...transports, created])
        setName('')
        hapticSuccess()
        showToast(t('transportAdded'), 'success')
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/transports/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setTransports(transports.filter((tr) => tr.id !== id))
      }
    } catch {
      // silent
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
        {t('transportTitle')}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        {t('transportDescription')}
      </p>

      <div className="mt-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('transportPlaceholder')}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:ring-accent"
          />
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('addTransport')}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {transports.length === 0 ? (
            <p className="text-center text-sm text-text-tertiary py-4">
              {t('noTransportsYet')}
            </p>
          ) : (
            transports.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary px-3 py-2"
              >
                <span className="font-medium text-text-primary">{tr.name}</span>
                <button
                  onClick={() => handleRemove(tr.id)}
                  className="rounded p-1 text-text-tertiary hover:bg-surface-secondary hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={handleBack}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          {t('back')}
        </button>
        <button
          onClick={handleNext}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
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
