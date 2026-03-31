import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { locales, defaultLocale } from '@/i18n/config'

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Locale detection: ensure NEXT_LOCALE cookie exists
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (!localeCookie || !locales.includes(localeCookie as typeof locales[number])) {
    const acceptLanguage = request.headers.get('accept-language') || ''
    const detected = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().substring(0, 2).toLowerCase())
      .find(lang => locales.includes(lang as typeof locales[number]))

    const locale = detected || defaultLocale
    const response = NextResponse.next()
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/calendar/:path*', '/export/:path*', '/settings/:path*', '/statistics/:path*'],
}
