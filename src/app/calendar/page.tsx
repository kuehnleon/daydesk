'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useTranslations, useLocale } from 'next-intl'
import { getDateFnsLocale } from '@/lib/date-locale'
import { useToast } from '@/components/ui/toast'
import { Navbar } from '@/components/navbar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Location, Transport, CalendarAttendance } from '@/types'
import { minLoadingDelay } from '@/lib/loading'
import { hapticSuccess } from '@/lib/haptic'
import { enqueue } from '@/lib/offline-queue'
import { clearAttendanceNotifications } from '@/lib/push-utils'
import { AttendanceModal } from '@/components/calendar/attendance-modal'
import { MonthlySummary } from '@/components/calendar/monthly-summary'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { useHydrated } from '@/hooks/useHydrated'

async function fetchAttendances(month: string, signal?: AbortSignal) {
  const response = await fetch(`/api/attendance?month=${month}`, { signal })
  if (!response.ok) return null
  const data: CalendarAttendance[] = await response.json()
  return Object.fromEntries(data.map(attendance => [attendance.date.split('T')[0], attendance]))
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [attendances, setAttendances] = useState<Record<string, CalendarAttendance>>({})
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [modalInteractive, setModalInteractive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [holidays, setHolidays] = useState<Set<string>>(new Set())
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [country, setCountry] = useState('DE')
  const [defaultState, setDefaultState] = useState('BW')
  const [locations, setLocations] = useState<Location[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null)
  const month = format(currentMonth, 'yyyy-MM')
  const year = currentMonth.getFullYear()
  const monthKey = `${month}:${country}:${defaultState}`
  const isLoadingMonth = loadedMonth !== monthKey
  const isLoadingAny = isLoadingInitial || isLoadingMonth
  const { showToast } = useToast()
  const t = useTranslations('calendar')
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  const isHydrated = useHydrated()
  const selectionHint = !isHydrated ? '' : window.matchMedia('(pointer: coarse)').matches
    ? t('selectionHintTouch')
    : t('selectionHintDesktop', { modifier: navigator.platform.toUpperCase().includes('MAC') ? '⌘' : 'Ctrl' })

  useEffect(() => {
    const loadSettings = async () => {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setWeekStartDay(data.weekStartDay ?? 1)
        if (data.workDays) {
          setWorkDays(data.workDays.split(',').map(Number))
        }
        setCountry(data.country ?? 'DE')
        setDefaultState(data.defaultState ?? '')
      }
    }

    const loadLocations = async () => {
      const response = await fetch('/api/locations')
      if (response.ok) {
        setLocations(await response.json())
      }
    }

    const loadTransports = async () => {
      const response = await fetch('/api/transports')
      if (response.ok) {
        setTransports(await response.json())
      }
    }

    Promise.all([loadSettings(), loadLocations(), loadTransports(), minLoadingDelay()]).finally(() => {
      setIsLoadingInitial(false)
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const loadAttendances = async () => {
      const data = await fetchAttendances(month, controller.signal)
      if (data && !controller.signal.aborted) setAttendances(data)
    }

    const loadHolidays = async () => {
      const params = new URLSearchParams({ year: year.toString(), country })
      if (defaultState) params.set('state', defaultState)
      const response = await fetch(`/api/holidays?${params}`, { signal: controller.signal })
      if (response.ok) {
        const data: { date: string }[] = await response.json()
        if (!controller.signal.aborted) setHolidays(new Set(data.map(holiday => holiday.date)))
      }
    }

    Promise.all([
      loadAttendances(),
      loadHolidays(),
      minLoadingDelay(),
    ]).catch((error) => {
      if (!controller.signal.aborted) console.error('Error loading calendar:', error)
    }).finally(() => {
      if (!controller.signal.aborted) setLoadedMonth(monthKey)
    })
    return () => controller.abort()
  }, [month, year, country, defaultState, monthKey])

  const loadAttendances = async () => {
    const data = await fetchAttendances(month)
    if (data) setAttendances(data)
  }

  const openModal = () => {
    setModalInteractive(false)
    setShowModal(true)
    setTimeout(() => {
      setModalInteractive(true)
    }, 400)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedDates(new Set())
  }

  const getSelectedDatesArray = (): string[] => {
    return Array.from(selectedDates).sort()
  }

  const saveAttendance = async (
    type: string,
    transportId: string | null,
    locationId: string | null = null,
    notes?: string | null
  ) => {
    const dates = getSelectedDatesArray()
    if (dates.length === 0) return

    setIsLoading(true)
    try {
      const results = await Promise.all(
        dates.map(dateStr =>
          fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, type, transportId, locationId, ...(notes !== undefined && { notes }) }),
          })
        )
      )

      const allOk = results.every(r => r.ok)
      if (allOk) {
        showToast(t('attendanceSaved', { count: dates.length }), 'success')
        hapticSuccess()
        clearAttendanceNotifications()
        await loadAttendances()
        closeModal()
      } else {
        showToast(t('failedToSave'), 'error')
      }
    } catch {
      if (!navigator.onLine) {
        for (const dateStr of dates) {
          await enqueue({ date: dateStr, type, transportId, locationId, ...(notes !== undefined && { notes: notes || undefined }) })
        }
        showToast(t('savedOffline', { count: dates.length }), 'success')
        hapticSuccess()
        clearAttendanceNotifications()
        closeModal()
      } else {
        showToast(t('errorSaving'), 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const clearAttendance = async () => {
    const dates = getSelectedDatesArray()
    const toDelete = dates.filter(dateStr => attendances[dateStr])

    if (toDelete.length === 0) {
      closeModal()
      return
    }

    setIsLoading(true)
    try {
      const results = await Promise.all(
        toDelete.map(dateStr =>
          fetch(`/api/attendance/${attendances[dateStr].id}`, { method: 'DELETE' })
        )
      )

      const allOk = results.every(r => r.ok)
      if (allOk) {
        showToast(t('cleared', { count: toDelete.length }), 'success')
        hapticSuccess()
        await loadAttendances()
        closeModal()
      } else {
        showToast(t('failedToClear'), 'error')
      }
    } catch {
      showToast(t('errorClearing'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-[calc(1.5rem+var(--sai-bottom))] sm:py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between sm:mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            {format(currentMonth, 'MMMM yyyy', { locale: dateFnsLocale })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="rounded-lg bg-accent p-2 text-white transition-colors hover:bg-accent-hover"
              aria-label={t('previousMonth')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-text-primary transition-colors hover:bg-surface-secondary"
            >
              {t('today')}
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="rounded-lg bg-accent p-2 text-white transition-colors hover:bg-accent-hover"
              aria-label={t('nextMonth')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="mb-4 text-sm text-text-secondary">
          {selectionHint}
        </p>

        {/* Color legend — mobile only */}
        {!isLoadingAny && (
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary sm:hidden">
            {locations.map(loc => (
              <span key={loc.id} className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: loc.color }} />
                {loc.name}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              {t('homeLegend')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
              {t('offLegend')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
              {t('sickHolidayLegend')}
            </span>
          </div>
        )}

        <MonthlySummary
          attendances={attendances}
          locations={locations}
          isLoading={isLoadingAny}
        />

        <CalendarGrid
          currentMonth={currentMonth}
          attendances={attendances}
          holidays={holidays}
          selectedDates={selectedDates}
          workDays={workDays}
          weekStartDay={weekStartDay}
          isLoadingMonth={isLoadingAny}
          isModalOpen={showModal}
          onSelectionChange={setSelectedDates}
          onSelectionComplete={(dates) => {
            setSelectedDates(dates)
            openModal()
          }}
          onMonthChange={setCurrentMonth}
        />
      </main>

      {showModal && selectedDates.size > 0 && (
        <div className={modalInteractive ? '' : 'pointer-events-none'}>
          <AttendanceModal
            selectedDates={selectedDates}
            attendances={attendances}
            locations={locations}
            transports={transports}
            isLoading={isLoading}
            onSave={saveAttendance}
            onClear={clearAttendance}
            onClose={closeModal}
          />
        </div>
      )}
    </div>
  )
}
