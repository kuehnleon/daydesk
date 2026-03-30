import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_BASE_URL || 'http://localhost:3000'
  const signInUrl = `${baseUrl}/auth/signin`

  // If the provider exposes a logout endpoint, redirect through it first
  const providerLogoutUrl = process.env.OAUTH_LOGOUT_URL
  if (providerLogoutUrl) {
    const logoutUrl = new URL(providerLogoutUrl)
    logoutUrl.searchParams.set('post_logout_redirect_uri', signInUrl)
    return NextResponse.redirect(logoutUrl.toString())
  }

  return NextResponse.redirect(signInUrl)
}
