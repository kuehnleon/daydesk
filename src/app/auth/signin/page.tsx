import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import SignInButton from './SignInButton'

export default async function SignIn() {
  const t = await getTranslations('signin')
  const session = await auth()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-[var(--sai-left)] pr-[var(--sai-right)] pt-[var(--sai-top)] pb-[var(--sai-bottom)]">
      <div className="mx-4 w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center">
          <svg width="48" height="48" viewBox="0 0 88 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent" aria-hidden="true">
            <rect x="4" y="16" width="80" height="76" rx="14" fill="currentColor"/>
            <rect x="14" y="36" width="60" height="46" rx="6" fill="var(--surface, #fff)"/>
            <rect x="24" y="4" width="12" height="24" rx="4" fill="currentColor"/>
            <rect x="52" y="4" width="12" height="24" rx="4" fill="currentColor"/>
            <circle cx="32" cy="51" r="4" fill="currentColor" opacity="0.2"/>
            <circle cx="52" cy="51" r="4" fill="currentColor" opacity="0.2"/>
            <circle cx="32" cy="68" r="4" fill="currentColor" opacity="0.2"/>
            <circle cx="52" cy="68" r="5.5" fill="currentColor"/>
          </svg>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary">
            daydesk
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            {t('tagline')}
          </p>
        </div>

        <SignInButton />
      </div>
    </div>
  )
}
