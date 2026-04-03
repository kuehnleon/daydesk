'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/toast'
import { minLoadingDelay } from '@/lib/loading'
import type { Transport, TransportFormData } from '@/types'

export function useTransportSettings(onDataChange?: () => void) {
  const [transports, setTransports] = useState<Transport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transport | null>(null)
  const [form, setForm] = useState<TransportFormData>({ name: '' })
  const { showToast } = useToast()
  const t = useTranslations('settings')

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [response] = await Promise.all([fetch('/api/transports'), minLoadingDelay()])
      if (response.ok) {
        const data = await response.json()
        setTransports(data)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '' })
    setShowModal(true)
  }

  const openEdit = (transport: Transport) => {
    setEditing(transport)
    setForm({ name: transport.name })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      showToast(t('nameRequired'), 'error')
      return
    }

    try {
      if (editing) {
        const response = await fetch(`/api/transports/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (response.ok) {
          showToast(t('transportUpdated'), 'success')
        } else {
          showToast(t('failedToUpdateTransport'), 'error')
          return
        }
      } else {
        const response = await fetch('/api/transports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (response.ok) {
          showToast(t('transportAdded'), 'success')
        } else {
          showToast(t('failedToAddTransport'), 'error')
          return
        }
      }
      setShowModal(false)
      load()
      onDataChange?.()
    } catch {
      showToast(t('errorSavingTransport'), 'error')
    }
  }

  const reorder = async (activeId: string, overId: string) => {
    const oldIndex = transports.findIndex((t) => t.id === activeId)
    const newIndex = transports.findIndex((t) => t.id === overId)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

    const reordered = [...transports]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    // Optimistic update
    setTransports(reordered)

    try {
      await Promise.all(
        reordered.map((tr, i) =>
          fetch(`/api/transports/${tr.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: i }),
          })
        )
      )
    } catch {
      showToast(t('reorderFailed'), 'error')
      load()
    }
  }

  const remove = async (id: string) => {
    if (!confirm(t('deleteTransportConfirm'))) return

    try {
      const response = await fetch(`/api/transports/${id}`, { method: 'DELETE' })
      if (response.ok) {
        showToast(t('transportDeleted'), 'success')
        load()
        onDataChange?.()
      } else {
        showToast(t('failedToDeleteTransport'), 'error')
      }
    } catch {
      showToast(t('errorDeletingTransport'), 'error')
    }
  }

  return {
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
    reorder,
    remove,
  }
}
