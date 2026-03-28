import { dequeueAll, remove } from './offline-queue'

export interface SyncResult {
  synced: number
  failed: number
}

export async function syncPendingEntries(): Promise<SyncResult> {
  const entries = await dequeueAll()
  if (entries.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const entry of entries) {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: entry.date,
          type: entry.type,
          transportId: entry.transportId,
          locationId: entry.locationId,
          notes: entry.notes,
        }),
      })

      if (response.ok || response.status === 400 || response.status === 401) {
        // Remove on success or permanent failure (bad data / auth issue)
        await remove(entry.id)
        if (response.ok) {
          synced++
        } else {
          failed++
        }
      } else {
        // Transient error — leave in queue for retry
        failed++
      }
    } catch {
      // Network error — leave in queue for retry
      failed++
    }
  }

  return { synced, failed }
}
