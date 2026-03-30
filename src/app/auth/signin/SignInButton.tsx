'use client'

import { signIn } from 'next-auth/react'

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn('oidc', { callbackUrl: '/dashboard' })}
      className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      Sign in
    </button>
  )
}
