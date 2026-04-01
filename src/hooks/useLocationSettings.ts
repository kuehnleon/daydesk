'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/toast'
import { minLoadingDelay } from '@/lib/loading'
import type { Location, Transport, LocationFormData } from '@/types'

export const COLOR_OPTIONS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#6366F1', // indigo
]

// Home Office uses emerald (#10B981) - reserved, not in COLOR_OPTIONS

export function useLocationSettings() {
  const [locations, setLocations] = useState<Location[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState<LocationFormData>({
    name: '',
    transportId: '',
    distance: '',
    color: COLOR_OPTIONS[0],
  })
  const { showToast } = useToast()
  const t = useTranslations('settings')

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [locRes, trRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/transports'),
        minLoadingDelay(),
      ])
      if (locRes.ok) {
        setLocations(await locRes.json())
      }
      if (trRes.ok) {
        setTransports(await trRes.json())
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
    setForm({
      name: '',
      transportId: '',
      distance: '',
      color: COLOR_OPTIONS[0],
    })
    setShowModal(true)
  }

  const openEdit = (location: Location) => {
    setEditing(location)
    setForm({
      name: location.name,
      transportId: location.transportId || '',
      distance: location.distance?.toString() || '',
      color: location.color,
    })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      showToast(t('nameRequired'), 'error')
      return
    }

    try {
      if (editing) {
        const response = await fetch(`/api/locations/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (response.ok) {
          showToast(t('locationUpdated'), 'success')
        } else {
          showToast(t('failedToUpdateLocation'), 'error')
          return
        }
      } else {
        const response = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (response.ok) {
          showToast(t('locationAdded'), 'success')
        } else {
          showToast(t('failedToAddLocation'), 'error')
          return
        }
      }
      setShowModal(false)
      load()
    } catch {
      showToast(t('errorSavingLocation'), 'error')
    }
  }

  const remove = async (id: string) => {
    if (!confirm(t('deleteLocationConfirm'))) return

    try {
      const response = await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      if (response.ok) {
        showToast(t('locationDeleted'), 'success')
        load()
      } else {
        showToast(t('failedToDeleteLocation'), 'error')
      }
    } catch {
      showToast(t('errorDeletingLocation'), 'error')
    }
  }

  return {
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
  }
}
