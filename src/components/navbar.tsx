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
      <nav className="sticky top-0 z-40 border-b border-border bg-surface pt-[var(--sai-top)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger button — mobile only */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="rounded-md p-2 text-text-secondary hover:bg-surface-secondary md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <a href="/dashboard" className="text-accent" aria-label="daydesk home">
                <svg width="120" height="32" viewBox="0 0 440 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="4" y="20" width="80" height="76" rx="14" fill="currentColor"/>
                  <rect x="14" y="40" width="60" height="46" rx="6" fill="var(--surface, #fff)"/>
                  <rect x="24" y="8" width="12" height="24" rx="4" fill="currentColor"/>
                  <rect x="52" y="8" width="12" height="24" rx="4" fill="currentColor"/>
                  <circle cx="32" cy="55" r="4" fill="currentColor" opacity="0.2"/>
                  <circle cx="52" cy="55" r="4" fill="currentColor" opacity="0.2"/>
                  <circle cx="32" cy="72" r="4" fill="currentColor" opacity="0.2"/>
                  <circle cx="52" cy="72" r="5.5" fill="currentColor"/>
                  <text x="104" y="82" fontFamily="-apple-system, 'SF Pro Display', 'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="68" fontWeight="700" letterSpacing="-2.5">
                    <tspan fill="var(--text-primary, #1a1a2e)">day</tspan><tspan fill="currentColor">desk</tspan>
                  </text>
                </svg>
              </a>
            </div>

            {/* Desktop nav links */}
            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-accent-soft text-accent'
                      : 'text-text-secondary hover:text-foreground hover:bg-surface-secondary'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <div className="ml-2 h-5 w-px bg-border" />
              <button
                onClick={handleSignOut}
                className="ml-2 rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-foreground"
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
          className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-surface pt-[var(--sai-top)] pl-[var(--sai-left)] shadow-overlay transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between px-4">
            <a
              href="/dashboard"
              className="text-accent"
              aria-label="daydesk home"
            >
              <svg width="120" height="32" viewBox="0 0 440 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="4" y="20" width="80" height="76" rx="14" fill="currentColor"/>
                <rect x="14" y="40" width="60" height="46" rx="6" fill="var(--surface, #fff)"/>
                <rect x="24" y="8" width="12" height="24" rx="4" fill="currentColor"/>
                <rect x="52" y="8" width="12" height="24" rx="4" fill="currentColor"/>
                <circle cx="32" cy="55" r="4" fill="currentColor" opacity="0.2"/>
                <circle cx="52" cy="55" r="4" fill="currentColor" opacity="0.2"/>
                <circle cx="32" cy="72" r="4" fill="currentColor" opacity="0.2"/>
                <circle cx="52" cy="72" r="5.5" fill="currentColor"/>
                <text x="104" y="82" fontFamily="-apple-system, 'SF Pro Display', 'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="68" fontWeight="700" letterSpacing="-2.5">
                  <tspan fill="var(--text-primary, #1a1a2e)">day</tspan><tspan fill="currentColor">desk</tspan>
                </text>
              </svg>
            </a>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="rounded-md p-2 text-text-secondary hover:bg-surface-secondary"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
          <div className="flex flex-1 flex-col gap-0.5 px-3 py-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-foreground'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-border p-3 pb-[calc(0.75rem+var(--sai-bottom))]">
            <button
              onClick={handleSignOut}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-foreground"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
