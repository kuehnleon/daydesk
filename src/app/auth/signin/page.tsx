import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import SignInButton from './SignInButton'

export default async function SignIn() {
  const session = await auth()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            WorkLog
          </h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Office Attendance Tracker
          </p>
        </div>

        <SignInButton />
      </div>
    </div>
  )
}
