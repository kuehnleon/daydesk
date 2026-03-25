'use client'

import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/statistics', label: 'Statistics' },
    { href: '/export', label: 'Export' },
    { href: '/settings', label: 'Settings' },
  ]

  return (
    <nav className="bg-white shadow-sm dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <a href="/dashboard" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              Daydesk
            </a>
          </div>
          <div className="flex items-center gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname === link.href
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'
                }`}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
