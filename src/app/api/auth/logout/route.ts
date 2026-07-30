import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withLogging } from '@/lib/api-utils'

const SESSION_COOKIE = process.env.NODE_ENV === 'production'
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token'

export const GET = withLogging(async (request) => {
  // Trust NEXTAUTH_URL as the canonical public origin — behind an ingress that
  // doesn't forward X-Forwarded-Host, `new URL(request.url).origin` falls back
  // to the pod-local host (e.g. localhost:3000) and leaks into user-facing URLs.
  const origin = process.env.NEXTAUTH_URL ?? new URL(request.url).origin
  const signInUrl = `${origin}/auth/signin`

  // Clear the NextAuth session cookie
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)

  // If the provider exposes a logout endpoint, redirect through it first
  const providerLogoutUrl = process.env.OAUTH_LOGOUT_URL
  if (providerLogoutUrl) {
    const logoutUrl = new URL(providerLogoutUrl)
    logoutUrl.searchParams.set('post_logout_redirect_uri', signInUrl)
    return NextResponse.redirect(logoutUrl.toString())
  }

  return NextResponse.redirect(signInUrl)
})
