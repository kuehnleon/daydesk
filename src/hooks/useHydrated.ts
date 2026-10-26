'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

/** Keep browser-only values out of server HTML and the initial hydration render. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
