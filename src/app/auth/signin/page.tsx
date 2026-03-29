import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import SignInButton from './SignInButton'

export default async function SignIn() {
  const session = await auth()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-[var(--sai-left)] pr-[var(--sai-right)] pt-[var(--sai-top)] pb-[var(--sai-bottom)]">
      <div className="mx-4 w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
            Daydesk
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            Track your office attendance, commute, and work location
          </p>
        </div>

        <SignInButton />
      </div>
    </div>
  )
}
