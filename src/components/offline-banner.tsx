'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { syncPendingEntries } from '@/lib/offline-sync'
import { count } from '@/lib/offline-queue'
import { useToast } from '@/components/ui/toast'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const t = useTranslations('offline')
  const { isOnline } = useOnlineStatus()
  const { showToast } = useToast()
  const wasOffline = useRef(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Track pending count
  useEffect(() => {
    const update = async () => {
      try {
        const c = await count()
        setPendingCount(c)
      } catch {
        // IndexedDB may not be available
      }
    }
    update()
    const interval = setInterval(update, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true
      return
    }

    if (wasOffline.current) {
      wasOffline.current = false
      syncPendingEntries().then((result) => {
        if (result.synced > 0) {
          showToast(t('synced', { count: result.synced }), 'success')
        }
        if (result.failed > 0) {
          showToast(t('failedToSync', { count: result.failed }), 'error')
        }
        count().then(setPendingCount).catch(() => {})
      })
    }
  }, [isOnline, showToast])

  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`px-[calc(1rem+var(--sai-left))] pr-[calc(1rem+var(--sai-right))] py-2 text-center text-sm font-medium ${
      isOnline
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
        : 'bg-amber-200 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        {!isOnline && <WifiOff className="h-4 w-4" />}
        {!isOnline
          ? t('youAreOffline')
          : t('pendingEntries', { count: pendingCount })
        }
      </div>
    </div>
  )
}
