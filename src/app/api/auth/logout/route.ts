import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { withLogging } from '@/lib/api-utils'
import { getOidcMetadata } from '@/lib/oidc-discovery'
import logger from '@/lib/logger'

/**
 * RP-initiated logout via the provider's OIDC `end_session_endpoint`.
 *
 * The navbar calls NextAuth's built-in `signOut({redirect:false})` first,
 * which clears the local session cookie. This route then redirects the
 * browser through the IdP so the SSO session is also terminated — sending
 * `id_token_hint` (per Auth0's best practice) to identify the session, and
 * `post_logout_redirect_uri` so the IdP sends the user back to our sign-in
 * page. The endpoint URL comes from OIDC discovery so we stay
 * provider-agnostic and don't have to keep a `${issuer}/oidc/logout`-style
 * env var in sync.
 */
export const GET = withLogging(async (request) => {
  // Trust NEXTAUTH_URL as the canonical public origin — behind an ingress that
  // doesn't forward X-Forwarded-Host, `new URL(request.url).origin` falls back
  // to the pod-local host (e.g. localhost:3000) and leaks into user-facing URLs.
  const origin = process.env.NEXTAUTH_URL ?? new URL(request.url).origin
  const signInUrl = `${origin}/auth/signin`

  const issuer = process.env.OAUTH_ISSUER
  if (!issuer) {
    return NextResponse.redirect(signInUrl)
  }

  // Read id_token from the encrypted JWT cookie server-side. Never exposed to
  // the client — see the `jwt` callback in src/lib/auth.ts.
  const token = await getToken({
    req: request as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  })
  const idToken = typeof token?.idToken === 'string' ? token.idToken : undefined

  try {
    const meta = await getOidcMetadata(issuer)
    const endSession = meta.end_session_endpoint
    if (!endSession) {
      logger.warn(
        { issuer },
        'OIDC discovery has no end_session_endpoint; skipping IdP logout',
      )
      return NextResponse.redirect(signInUrl)
    }
    const logoutUrl = new URL(endSession)
    logoutUrl.searchParams.set('post_logout_redirect_uri', signInUrl)
    if (idToken) {
      logoutUrl.searchParams.set('id_token_hint', idToken)
    } else if (process.env.OAUTH_CLIENT_ID) {
      // Fallback for sessions that predate id_token persistence in the JWT.
      logoutUrl.searchParams.set('client_id', process.env.OAUTH_CLIENT_ID)
    }
    return NextResponse.redirect(logoutUrl.toString())
  } catch (err) {
    logger.warn(
      { err, issuer },
      'OIDC discovery failed; falling back to local signin',
    )
    return NextResponse.redirect(signInUrl)
  }
})
