/**
 * Trigger a short haptic vibration on supported devices.
 * Falls back silently on devices/browsers without Vibration API support.
 */
export function haptic(ms = 10) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms)
  }
}

/** Double-pulse for confirmed actions (save, log, clear). */
export function hapticSuccess() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([10, 50, 10])
  }
}

/** Heavier single pulse for destructive or significant actions. */
export function hapticHeavy() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(20)
  }
}
