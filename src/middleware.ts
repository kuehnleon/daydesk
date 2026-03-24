export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: ['/dashboard/:path*', '/calendar/:path*', '/export/:path*', '/settings/:path*'],
}
