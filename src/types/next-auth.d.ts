import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    // OIDC id_token persisted at sign-in for use as `id_token_hint` in
    // RP-initiated logout. Server-side only; never exposed to the client.
    idToken?: string
  }
}
