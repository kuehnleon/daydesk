/**
 * OIDC discovery — fetch and cache `/.well-known/openid-configuration`.
 *
 * The IdP publishes its endpoints (authorization, token, end_session, …) in a
 * discovery document. NextAuth already reads this internally via the provider's
 * `wellKnown` config; this helper exposes the same document to app code that
 * needs endpoints NextAuth doesn't surface (currently just `end_session_endpoint`
 * for RP-initiated logout).
 *
 * Caching: keyed by issuer URL, module-level `Map` holding the fetch *promise*
 * (not the resolved value) so concurrent first-callers share one request.
 * Failures are removed from the cache so the next call retries — a permanently
 * cached failure would leave logout broken for the process lifetime.
 */

type OidcMetadata = {
  end_session_endpoint?: string
}

const cache = new Map<string, Promise<OidcMetadata>>()

export function getOidcMetadata(issuer: string): Promise<OidcMetadata> {
  let p = cache.get(issuer)
  if (!p) {
    p = fetch(`${issuer}/.well-known/openid-configuration`)
      .then((r) => {
        if (!r.ok) throw new Error(`OIDC discovery ${r.status} for ${issuer}`)
        return r.json() as Promise<OidcMetadata>
      })
      .catch((err) => {
        // Don't cache the failure — next caller retries.
        cache.delete(issuer)
        throw err
      })
    cache.set(issuer, p)
  }
  return p
}

/** Test-only. Clears the module-level cache. */
export function _resetOidcDiscoveryCache(): void {
  cache.clear()
}
