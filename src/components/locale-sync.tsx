'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function LocaleSync() {
  const { status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return

    fetch('/api/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.locale) return
        const current = document.cookie
          .split('; ')
          .find(c => c.startsWith('NEXT_LOCALE='))
          ?.split('=')[1]
        if (current !== data.locale) {
          document.cookie = `NEXT_LOCALE=${data.locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
          window.location.reload()
        }
      })
      .catch(() => {})
  }, [status])

  return null
}
