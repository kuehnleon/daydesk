import { NextResponse } from 'next/server'

export async function GET() {
  const domain = process.env.AUTH0_DOMAIN
  const clientId = process.env.AUTH0_CLIENT_ID
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_BASE_URL || 'http://localhost:3000'

  const logoutUrl = new URL(`https://${domain}/v2/logout`)
  logoutUrl.searchParams.set('client_id', clientId!)
  logoutUrl.searchParams.set('returnTo', `${baseUrl}/auth/signin`)

  return NextResponse.redirect(logoutUrl.toString())
}
