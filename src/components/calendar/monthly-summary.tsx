'use client'

import { useTranslations } from 'next-intl'
import { Building2, Home, BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Location, CalendarAttendance } from '@/types'

interface MonthlySummaryProps {
  attendances: Record<string, CalendarAttendance>
  locations: Location[]
  isLoading: boolean
}

export function MonthlySummary({ attendances, locations, isLoading }: MonthlySummaryProps) {
  const t = useTranslations('calendar')

  const getSummary = () => {
    const entries = Object.values(attendances)
    const homeOffice = entries.filter(a => a.type === 'home').length
    const total = entries.length

    const locationCounts: Record<string, number> = {}
    let officeNoLocation = 0

    entries.forEach(a => {
      if (a.type === 'office') {
        if (a.locationId && a.location) {
          locationCounts[a.locationId] = (locationCounts[a.locationId] || 0) + 1
        } else {
          officeNoLocation++
        }
      }
    })

    return { homeOffice, total, locationCounts, officeNoLocation }
  }

  const summary = getSummary()

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {isLoading ? (
        <>
          <Skeleton className="h-[72px] rounded-xl" />
          <Skeleton className="h-[72px] rounded-xl" />
          <Skeleton className="h-[72px] rounded-xl" />
        </>
      ) : (
        <>
          {locations.map(loc => {
            const count = summary.locationCounts[loc.id] || 0
            if (count === 0) return null
            return (
              <div
                key={loc.id}
                className="flex items-center gap-3 card p-4"
              >
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: `${loc.color}33` }}
                >
                  <Building2 className="h-5 w-5" style={{ color: loc.color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-text-primary">{count}</div>
                  <div className="truncate text-xs text-text-secondary">{loc.name}</div>
                </div>
              </div>
            )
          })}

          {summary.officeNoLocation > 0 && (
            <div className="flex items-center gap-3 card p-4">
              <div className="rounded-lg bg-blue-200 p-2 dark:bg-blue-800">
                <Building2 className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-text-primary">{summary.officeNoLocation}</div>
                <div className="truncate text-xs text-text-secondary">{t('officeLegacy')}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 card p-4">
            <div className="rounded-lg bg-emerald-200 p-2 dark:bg-emerald-800">
              <Home className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-text-primary">{summary.homeOffice}</div>
              <div className="truncate text-xs text-text-secondary">{t('homeOffice')}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 card p-4">
            <div className="rounded-lg bg-surface-secondary p-2">
              <BarChart3 className="h-5 w-5 text-text-secondary" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-text-primary">{summary.total}</div>
              <div className="truncate text-xs text-text-secondary">{t('totalDays')}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
