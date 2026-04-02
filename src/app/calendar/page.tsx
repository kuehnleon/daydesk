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
import { enqueue } from '@/lib/offline-queue'
import { AttendanceModal } from '@/components/calendar/attendance-modal'
import { MonthlySummary } from '@/components/calendar/monthly-summary'
import { CalendarGrid } from '@/components/calendar/calendar-grid'

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
  const [isLoadingMonth, setIsLoadingMonth] = useState(true)
  const isLoadingAny = isLoadingInitial || isLoadingMonth
  const [selectionHint, setSelectionHint] = useState('')
  const { showToast } = useToast()
  const t = useTranslations('calendar')
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    if (isTouchDevice) {
      setSelectionHint(t('selectionHintTouch'))
    } else {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const modifier = isMac ? '⌘' : 'Ctrl'
      setSelectionHint(t('selectionHintDesktop', { modifier }))
    }
  }, [])

  useEffect(() => {
    Promise.all([loadSettings(), loadLocations(), loadTransports(), minLoadingDelay()]).finally(() => {
      setIsLoadingInitial(false)
    })
  }, [])

  useEffect(() => {
    setIsLoadingMonth(true)
    Promise.all([loadAttendances(), loadHolidays(), minLoadingDelay()]).finally(() => {
      setIsLoadingMonth(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth])

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

  const loadAttendances = async () => {
    const month = format(currentMonth, 'yyyy-MM')
    const response = await fetch(`/api/attendance?month=${month}`)
    if (response.ok) {
      const data = await response.json()
      const map: Record<string, CalendarAttendance> = {}
      data.forEach((a: CalendarAttendance) => {
        map[a.date.split('T')[0]] = a
      })
      setAttendances(map)
    }
  }

  const loadHolidays = async () => {
    const year = currentMonth.getFullYear()
    const params = new URLSearchParams({ year: year.toString(), country })
    if (defaultState) params.set('state', defaultState)
    const response = await fetch(`/api/holidays?${params}`)
    if (response.ok) {
      const data = await response.json()
      const dates = new Set<string>(data.map((h: { date: string }) => h.date))
      setHolidays(dates)
    }
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
    locationId: string | null = null
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
            body: JSON.stringify({ date: dateStr, type, transportId, locationId }),
          })
        )
      )

      const allOk = results.every(r => r.ok)
      if (allOk) {
        showToast(t('attendanceSaved', { count: dates.length }), 'success')
        await loadAttendances()
        closeModal()
      } else {
        showToast(t('failedToSave'), 'error')
      }
    } catch {
      if (!navigator.onLine) {
        for (const dateStr of dates) {
          await enqueue({ date: dateStr, type, transportId, locationId })
        }
        showToast(t('savedOffline', { count: dates.length }), 'success')
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
