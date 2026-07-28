/**
 * Auth fixture: mint a signed next-auth JWT and inject it as a cookie
 * so tests bypass the OIDC flow entirely. Same secret & format the app uses.
 */
import { encode } from 'next-auth/jwt'
import type { BrowserContext, Cookie } from '@playwright/test'

/** Cookie name next-auth uses in dev/http contexts. */
export const NEXT_AUTH_COOKIE_NAME = 'next-auth.session-token'

export async function makeSessionCookie(userId: string, opts: {
  baseURL: string
  email?: string
  name?: string
  maxAgeSeconds?: number
}): Promise<Cookie> {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET must be set for auth fixture')

  const maxAge = opts.maxAgeSeconds ?? 60 * 60 // 1h
  const value = await encode({
    // Mirrors the shape produced by auth.ts's jwt() callback (adds `id`).
    token: {
      id: userId,
      sub: userId,
      email: opts.email ?? 'test@example.test',
      name: opts.name ?? 'Test User',
    },
    secret,
    maxAge,
  })

  const url = new URL(opts.baseURL)
  return {
    name: NEXT_AUTH_COOKIE_NAME,
    value,
    domain: url.hostname,
    path: '/',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + maxAge,
  }
}

/**
 * Convenience: apply a session cookie to an existing browser context
 * (used mainly from tests that create additional users mid-run).
 */
export async function signIn(context: BrowserContext, userId: string, opts: {
  baseURL: string
  email?: string
  name?: string
}) {
  const cookie = await makeSessionCookie(userId, opts)
  await context.addCookies([cookie])
  // Also set NEXT_LOCALE so requests are deterministic.
  await context.addCookies([{
    name: 'NEXT_LOCALE',
    value: 'en',
    domain: new URL(opts.baseURL).hostname,
    path: '/',
    sameSite: 'Lax',
  }])
}
