'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay, isBefore, isAfter } from 'date-fns'
import { useTranslations } from 'next-intl'
import {
  Building2,
  Home,
  Palmtree,
  ThermometerSun,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { CalendarAttendance } from '@/types'

interface CalendarGridProps {
  currentMonth: Date
  attendances: Record<string, CalendarAttendance>
  holidays: Set<string>
  selectedDates: Set<string>
  workDays: number[]
  weekStartDay: number
  isLoadingMonth: boolean
  isModalOpen: boolean
  onSelectionChange: (dates: Set<string>) => void
  onSelectionComplete: (dates: Set<string>) => void
  onMonthChange: (month: Date) => void
}

export function CalendarGrid({
  currentMonth,
  attendances,
  holidays,
  selectedDates,
  workDays,
  weekStartDay,
  isLoadingMonth,
  isModalOpen,
  onSelectionChange,
  onSelectionComplete,
  onMonthChange,
}: CalendarGridProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const isMultiSelecting = useRef(false)
  const isTouching = useRef(false)
  const calendarGridRef = useRef<HTMLDivElement>(null)
  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)

  const tDays = useTranslations('daysShort')

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getDayNames = () => {
    const dayKeys = weekStartDay === 1
      ? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      : ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    return dayKeys.map(key => tDays(key))
  }

  const getFirstDayOffset = () => {
    const dayOfWeek = getDay(monthStart)
    if (weekStartDay === 1) {
      return dayOfWeek === 0 ? 6 : dayOfWeek - 1
    }
    return dayOfWeek
  }

  const isNonWorkingDay = (date: Date) => {
    const dow = getDay(date)
    const adjusted = dow === 0 ? 7 : dow
    return !workDays.includes(adjusted)
  }

  const getDayColor = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const attendance = attendances[dateStr]

    if (holidays.has(dateStr)) return 'bg-red-100 dark:bg-red-900'

    if (attendance?.location?.color) {
      return ''
    }

    if (attendance?.type === 'office') return 'bg-blue-100 dark:bg-blue-900'
    if (attendance?.type === 'home') return 'bg-emerald-200 dark:bg-emerald-800'
    if (attendance?.type === 'off') return 'bg-amber-100 dark:bg-amber-900'
    if (attendance?.type === 'sick') return 'bg-red-100 dark:bg-red-900'
    if (isNonWorkingDay(date)) return 'bg-surface-secondary'
    return 'bg-surface'
  }

  const getDayStyle = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const attendance = attendances[dateStr]
    if (attendance?.location?.color) {
      return { backgroundColor: `${attendance.location.color}33` }
    }
    return {}
  }

  const isDateSelected = (date: Date) => {
    return selectedDates.has(format(date, 'yyyy-MM-dd'))
  }

  const getDateRange = (start: Date, end: Date): Date[] => {
    const rangeStart = isBefore(start, end) ? start : end
    const rangeEnd = isAfter(start, end) ? start : end
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  }

  const isDaySelectable = (date: Date) => {
    return !isNonWorkingDay(date) || !!attendances[format(date, 'yyyy-MM-dd')]
  }

  const toggleDateInSelection = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const next = new Set(selectedDates)
    if (next.has(dateStr)) {
      next.delete(dateStr)
    } else {
      next.add(dateStr)
    }
    onSelectionChange(next)
  }

  const getAttendanceIcon = (attendance: CalendarAttendance) => {
    if (attendance.type === 'home') {
      return <Home className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
    }
    if (attendance.type === 'office') {
      const color = attendance.location?.color
      return (
        <Building2
          className="h-5 w-5"
          style={{ color: color || '#3B82F6' }}
        />
      )
    }
    if (attendance.type === 'off') {
      return <Palmtree className="h-5 w-5 text-amber-600 dark:text-amber-400" />
    }
    if (attendance.type === 'sick') {
      return <ThermometerSun className="h-5 w-5 text-red-600 dark:text-red-400" />
    }
    return null
  }

  // Mouse handlers
  const handleMouseDown = (day: Date, e: React.MouseEvent) => {
    if (isTouching.current) return
    e.preventDefault()

    if (e.metaKey || e.ctrlKey) {
      isMultiSelecting.current = true
      toggleDateInSelection(day)
    } else {
      setIsSelecting(true)
      setSelectionStart(day)
      onSelectionChange(new Set([format(day, 'yyyy-MM-dd')]))
    }
  }

  const handleMouseEnter = (day: Date) => {
    if (isSelecting && selectionStart) {
      const range = getDateRange(selectionStart, day)
      onSelectionChange(new Set(range.filter(isDaySelectable).map(d => format(d, 'yyyy-MM-dd'))))
    }
  }

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectedDates.size > 0) {
      onSelectionComplete(selectedDates)
    }
    setIsSelecting(false)
    setSelectionStart(null)
  }, [isSelecting, selectedDates, onSelectionComplete])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleMouseUp()
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isSelecting, handleMouseUp])

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'Meta' || e.key === 'Control') && isMultiSelecting.current) {
        isMultiSelecting.current = false
        if (selectedDates.size > 0) {
          onSelectionComplete(selectedDates)
        }
      }
    }
    window.addEventListener('keyup', handleKeyUp)
    return () => window.removeEventListener('keyup', handleKeyUp)
  }, [selectedDates, onSelectionComplete])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (isModalOpen) return
      if (selectedDates.size > 0 && calendarGridRef.current && !calendarGridRef.current.contains(e.target as Node)) {
        onSelectionChange(new Set())
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [selectedDates, isModalOpen, onSelectionChange])

  // Touch handlers
  const handleTouchStart = (day: Date) => {
    isTouching.current = true
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      toggleDateInSelection(day)
    }, 500)
  }

  const handleTouchEnd = (day: Date, e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    const deltaX = Math.abs(e.changedTouches[0].clientX - swipeStartX.current)
    const deltaY = Math.abs(e.changedTouches[0].clientY - swipeStartY.current)
    if (deltaX > 50 && deltaX > deltaY) {
      // Swipe — ignore tap
    } else if (longPressTriggered.current) {
      longPressTriggered.current = false
    } else {
      const dateStr = format(day, 'yyyy-MM-dd')
      if (selectedDates.size > 0) {
        onSelectionComplete(selectedDates)
      } else {
        const next = new Set([dateStr])
        onSelectionChange(next)
        onSelectionComplete(next)
      }
    }
    setTimeout(() => { isTouching.current = false }, 400)
  }

  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX
    swipeStartY.current = e.touches[0].clientY
  }

  const handleSwipeEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - swipeStartX.current
    const deltaY = e.changedTouches[0].clientY - swipeStartY.current
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      const direction = deltaX < 0 ? 'left' : 'right'
      setSlideDirection(direction)
      setTimeout(() => {
        if (direction === 'left') {
          onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
        } else {
          onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
        }
        setSlideDirection(null)
      }, 150)
    }
  }

  return (
    <div
      ref={calendarGridRef}
      className="grid grid-cols-7 gap-1 select-none sm:gap-2"
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
      style={{
        transition: slideDirection ? 'transform 150ms ease-out, opacity 150ms ease-out' : undefined,
        transform: slideDirection === 'left' ? 'translateX(-30px)' : slideDirection === 'right' ? 'translateX(30px)' : undefined,
        opacity: slideDirection ? 0.5 : undefined,
      }}
    >
      {getDayNames().map(day => (
        <div key={day} className="p-2 text-center text-sm font-semibold text-text-secondary">
          {day}
        </div>
      ))}

      {Array.from({ length: getFirstDayOffset() }).map((_, i) => (
        <div key={`empty-${i}`} />
      ))}

      {isLoadingMonth ? (
        days.map((_, i) => (
          <Skeleton key={`skel-${i}`} className="min-h-14 rounded-lg sm:min-h-20" />
        ))
      ) : (
        days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const attendance = attendances[dateStr]
          const selected = isDateSelected(day)
          const isHoliday = holidays.has(dateStr)
          const isDayDisabled = isNonWorkingDay(day) && !attendance

          return (
            <button
              key={dateStr}
              onMouseDown={(e) => !isDayDisabled && handleMouseDown(day, e)}
              onMouseEnter={() => handleMouseEnter(day)}
              onTouchStart={() => !isDayDisabled && handleTouchStart(day)}
              onTouchEnd={(e) => handleTouchEnd(day, e)}
              disabled={isDayDisabled}
              className={`
                min-h-14 rounded-lg p-1.5 text-left transition-all sm:min-h-20 sm:p-2
                ${getDayColor(day)}
                ${isToday(day) ? 'ring-2 ring-accent' : ''}
                ${isDayDisabled
                  ? 'cursor-default opacity-50'
                  : `${selected ? 'ring-2 ring-accent ring-offset-2 dark:ring-offset-background' : 'hover:ring-2 hover:ring-accent/40'}
                     ${isSelecting ? 'cursor-crosshair' : 'cursor-pointer'}`
                }
              `}
              style={getDayStyle(day)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{format(day, 'd')}</span>
                <span className="hidden sm:block">
                  {isHoliday && <Palmtree className="h-5 w-5 text-red-600 dark:text-red-400" />}
                  {!isHoliday && attendance && getAttendanceIcon(attendance)}
                </span>
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}
