import { describe, it, expect, beforeEach, vi } from 'vitest'
import { _resetOidcDiscoveryCache, getOidcMetadata } from '@/lib/oidc-discovery'

const ISSUER = 'https://idp.example.com'
const DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`

describe('getOidcMetadata', () => {
  beforeEach(() => {
    _resetOidcDiscoveryCache()
    vi.restoreAllMocks()
  })

  it('fetches and returns discovery metadata', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ end_session_endpoint: `${ISSUER}/oidc/logout` }),
        { status: 200 },
      ),
    )
    const meta = await getOidcMetadata(ISSUER)
    expect(meta.end_session_endpoint).toBe(`${ISSUER}/oidc/logout`)
    expect(fetchSpy).toHaveBeenCalledWith(DISCOVERY_URL)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('shares a single fetch across concurrent callers', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ end_session_endpoint: `${ISSUER}/oidc/logout` }),
        { status: 200 },
      ),
    )
    const [a, b] = await Promise.all([
      getOidcMetadata(ISSUER),
      getOidcMetadata(ISSUER),
    ])
    expect(a).toBe(b) // same promise, same resolved value
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('caches successful fetches across sequential calls', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ end_session_endpoint: `${ISSUER}/oidc/logout` }),
        { status: 200 },
      ),
    )
    await getOidcMetadata(ISSUER)
    await getOidcMetadata(ISSUER)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not cache failed fetches — next call retries', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ end_session_endpoint: `${ISSUER}/oidc/logout` }),
          { status: 200 },
        ),
      )

    await expect(getOidcMetadata(ISSUER)).rejects.toThrow(/500/)
    const meta = await getOidcMetadata(ISSUER)
    expect(meta.end_session_endpoint).toBe(`${ISSUER}/oidc/logout`)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('does not cache network errors — next call retries', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ end_session_endpoint: `${ISSUER}/oidc/logout` }),
          { status: 200 },
        ),
      )

    await expect(getOidcMetadata(ISSUER)).rejects.toThrow(/network down/)
    const meta = await getOidcMetadata(ISSUER)
    expect(meta.end_session_endpoint).toBe(`${ISSUER}/oidc/logout`)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
