'use client'

/**
 * useLongPress — a click/long-press disambiguator for a single element.
 *
 * Fires `onLongPress` after `delayMs` (500ms by default) of a mouse or
 * touch hold. If the pointer is released before the threshold, `onClick`
 * fires instead. Right-click (contextmenu) is treated as a long-press so
 * mouse users have an accessible fallback that doesn't require holding.
 *
 * Swipes (>50px horizontal on touch) cancel both — the intent is a
 * scroll or navigation, not an action on the element.
 *
 * The `isTouching` sentinel prevents the same gesture from firing twice
 * via the synthetic mouse events browsers emit after touch. This mirrors
 * the pattern in `src/components/calendar/calendar-grid.tsx` where it
 * has been proven in production; a follow-up can migrate that file to
 * this hook.
 */
import { useCallback, useRef, useEffect } from 'react'
import { haptic } from '@/lib/haptic'

interface UseLongPressOptions {
  onLongPress: () => void
  onClick?: () => void
  delayMs?: number
  disabled?: boolean
}

interface UseLongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void
  onMouseUp: (e: React.MouseEvent) => void
  onMouseLeave: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function useLongPress({
  onLongPress,
  onClick,
  delayMs = 500,
  disabled = false,
}: UseLongPressOptions): UseLongPressHandlers {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)
  const isTouching = useRef(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  // Latest-callback refs so the handlers stay referentially stable but
  // always call the current props (avoids re-attaching listeners each
  // render when a caller passes an inline arrow function).
  const longPressCb = useRef(onLongPress)
  const clickCb = useRef(onClick)
  useEffect(() => {
    longPressCb.current = onLongPress
    clickCb.current = onClick
  })

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (disabled) return
    longPressFired.current = false
    clear()
    timer.current = setTimeout(() => {
      longPressFired.current = true
      haptic()
      longPressCb.current()
    }, delayMs)
  }, [disabled, delayMs, clear])

  const finish = useCallback(() => {
    const wasLongPress = longPressFired.current
    clear()
    longPressFired.current = false
    if (!wasLongPress && !disabled && clickCb.current) {
      clickCb.current()
    }
  }, [disabled, clear])

  return {
    onMouseDown: (e) => {
      if (isTouching.current) return
      if (e.button !== 0) return // ignore middle/right buttons here
      start()
    },
    onMouseUp: (e) => {
      if (isTouching.current) return
      if (e.button !== 0) return
      finish()
    },
    onMouseLeave: () => {
      if (isTouching.current) return
      // Cancel a pending long-press without firing click — the user
      // moved off the element mid-hold.
      clear()
      longPressFired.current = false
    },
    onTouchStart: (e) => {
      isTouching.current = true
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      start()
    },
    onTouchMove: (e) => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      if (dx > 10 || dy > 10) {
        // Movement means scroll or swipe intent — cancel the timer
        // silently.
        clear()
        longPressFired.current = false
      }
    },
    onTouchEnd: (e) => {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartX.current)
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
      const isSwipe = dx > 50 && dx > dy
      const wasLongPress = longPressFired.current
      clear()
      longPressFired.current = false
      if (!isSwipe && !wasLongPress && !disabled && clickCb.current) {
        clickCb.current()
      }
      // Keep the touch flag up briefly so the synthetic mouse events
      // that follow a touch don't re-fire this gesture.
      setTimeout(() => {
        isTouching.current = false
      }, 400)
    },
    onContextMenu: (e) => {
      if (disabled) return
      e.preventDefault()
      clear()
      longPressFired.current = true // suppress the click that follows
      haptic()
      longPressCb.current()
    },
  }
}
