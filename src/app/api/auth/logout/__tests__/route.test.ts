import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}))

vi.mock('@/lib/oidc-discovery', () => ({
  getOidcMetadata: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { GET } from '@/app/api/auth/logout/route'
import { getToken } from 'next-auth/jwt'
import { getOidcMetadata } from '@/lib/oidc-discovery'
import { dummyCtx } from '@/test/helpers'

const mockGetToken = getToken as unknown as ReturnType<typeof vi.fn>
const mockGetOidcMetadata = getOidcMetadata as unknown as ReturnType<typeof vi.fn>

const NEXTAUTH_URL = 'https://daydesk.example.com'
const OAUTH_ISSUER = 'https://idp.example.com'
const CLIENT_ID = 'test-client-id'
const END_SESSION = `${OAUTH_ISSUER}/oidc/logout`

function makeRequest(url = 'https://daydesk.example.com/api/auth/logout') {
  return new Request(url)
}

describe('GET /api/auth/logout', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXTAUTH_URL = NEXTAUTH_URL
    process.env.OAUTH_ISSUER = OAUTH_ISSUER
    process.env.OAUTH_CLIENT_ID = CLIENT_ID
    process.env.NEXTAUTH_SECRET = 'test-secret'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('sends id_token_hint when the JWT contains an idToken', async () => {
    mockGetToken.mockResolvedValueOnce({ id: 'u1', idToken: 'the-id-token' })
    mockGetOidcMetadata.mockResolvedValueOnce({ end_session_endpoint: END_SESSION })

    const res = await GET(makeRequest(), dummyCtx)
    const location = new URL(res.headers.get('location')!)

    expect(location.origin + location.pathname).toBe(END_SESSION)
    expect(location.searchParams.get('post_logout_redirect_uri')).toBe(
      `${NEXTAUTH_URL}/auth/signin`,
    )
    expect(location.searchParams.get('id_token_hint')).toBe('the-id-token')
    expect(location.searchParams.get('client_id')).toBeNull()
  })

  it('falls back to client_id when no idToken is available', async () => {
    mockGetToken.mockResolvedValueOnce({ id: 'u1' })
    mockGetOidcMetadata.mockResolvedValueOnce({ end_session_endpoint: END_SESSION })

    const res = await GET(makeRequest(), dummyCtx)
    const location = new URL(res.headers.get('location')!)

    expect(location.searchParams.get('id_token_hint')).toBeNull()
    expect(location.searchParams.get('client_id')).toBe(CLIENT_ID)
    expect(location.searchParams.get('post_logout_redirect_uri')).toBe(
      `${NEXTAUTH_URL}/auth/signin`,
    )
  })

  it('falls back to client_id when the JWT is missing entirely', async () => {
    mockGetToken.mockResolvedValueOnce(null)
    mockGetOidcMetadata.mockResolvedValueOnce({ end_session_endpoint: END_SESSION })

    const res = await GET(makeRequest(), dummyCtx)
    const location = new URL(res.headers.get('location')!)

    expect(location.searchParams.get('id_token_hint')).toBeNull()
    expect(location.searchParams.get('client_id')).toBe(CLIENT_ID)
  })

  it('redirects to local sign-in when OAUTH_ISSUER is unset', async () => {
    delete process.env.OAUTH_ISSUER

    const res = await GET(makeRequest(), dummyCtx)
    expect(res.headers.get('location')).toBe(`${NEXTAUTH_URL}/auth/signin`)
    expect(mockGetOidcMetadata).not.toHaveBeenCalled()
  })

  it('fails open (local sign-in) when discovery rejects', async () => {
    mockGetToken.mockResolvedValueOnce({ idToken: 'x' })
    mockGetOidcMetadata.mockRejectedValueOnce(new Error('discovery down'))

    const res = await GET(makeRequest(), dummyCtx)
    expect(res.headers.get('location')).toBe(`${NEXTAUTH_URL}/auth/signin`)
  })

  it('fails open when discovery has no end_session_endpoint', async () => {
    mockGetToken.mockResolvedValueOnce({ idToken: 'x' })
    mockGetOidcMetadata.mockResolvedValueOnce({})

    const res = await GET(makeRequest(), dummyCtx)
    expect(res.headers.get('location')).toBe(`${NEXTAUTH_URL}/auth/signin`)
  })

  it('derives origin from request.url when NEXTAUTH_URL is unset', async () => {
    delete process.env.NEXTAUTH_URL
    mockGetToken.mockResolvedValueOnce({ idToken: 'x' })
    mockGetOidcMetadata.mockResolvedValueOnce({ end_session_endpoint: END_SESSION })

    const res = await GET(makeRequest('https://fallback.example.net/api/auth/logout'), dummyCtx)
    const location = new URL(res.headers.get('location')!)
    expect(location.searchParams.get('post_logout_redirect_uri')).toBe(
      'https://fallback.example.net/auth/signin',
    )
  })
})
