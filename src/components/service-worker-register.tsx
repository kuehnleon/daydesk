'use client'

import { useEffect } from 'react'
import { syncPendingEntries } from '@/lib/offline-sync'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('SW registered:', registration.scope)
        })
        .catch((error) => {
          console.error('SW registration failed:', error)
        })
    }

    // Sync offline entries when coming back online
    const handleOnline = () => {
      syncPendingEntries().catch(() => {})
    }
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return null
}
