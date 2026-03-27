'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setIsMenuOpen(false) // eslint-disable-line react-hooks/set-state-in-effect -- intentional: close menu on navigation
  }, [pathname])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/statistics', label: 'Statistics' },
    { href: '/export', label: 'Export' },
    { href: '/settings', label: 'Settings' },
  ]

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    window.location.href = '/api/auth/logout'
  }

  return (
    <>
      <nav className="bg-white shadow-sm dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger button — mobile only */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <a href="/dashboard" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                Daydesk
              </a>
            </div>

            {/* Desktop nav links */}
            <div className="hidden items-center gap-4 md:flex">
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
                onClick={handleSignOut}
                className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${isMenuOpen ? 'visible' : 'invisible'}`}
        aria-hidden={!isMenuOpen}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Sidebar panel */}
        <div
          className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-800 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4">
            <a
              href="/dashboard"
              className="text-2xl font-bold text-indigo-600 dark:text-indigo-400"
            >
              Daydesk
            </a>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
          <div className="flex flex-1 flex-col gap-1 px-3 py-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="w-full rounded-lg bg-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
