/**
 * Trigger a short haptic vibration on supported devices.
 * Falls back silently on devices/browsers without Vibration API support.
 */
export function haptic(ms = 10) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms)
  }
}
