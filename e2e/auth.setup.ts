/**
 * Setup project: creates a persistent "configured" user and writes a
 * storageState file that downstream tests reuse. This runs once before
 * any tests in the chromium project.
 *
 * Tests that need a fresh DB per case should call resetDb() themselves
 * (via the base `test` fixture from ./fixtures/test.ts) — this setup
 * only bootstraps a default logged-in identity.
 */
import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { resetDb } from './fixtures/db'
import { createUser } from './fixtures/seed'
import { makeSessionCookie } from './fixtures/auth'

const authDir = path.resolve(__dirname, '..', 'playwright', '.auth')
const configuredAuthFile = path.join(authDir, 'configured.json')

setup('bootstrap configured user + storage state', async ({ baseURL }) => {
  expect(baseURL, 'Playwright baseURL must be set').toBeTruthy()

  fs.mkdirSync(authDir, { recursive: true })

  await resetDb()
  const user = await createUser({
    email: 'configured@example.test',
    name: 'Configured User',
    onboardingCompleted: true,
  })

  const cookie = await makeSessionCookie(user.id, {
    baseURL: baseURL!,
    email: user.email,
    name: user.name,
  })

  const state = {
    cookies: [
      cookie,
      {
        name: 'NEXT_LOCALE',
        value: 'en',
        domain: new URL(baseURL!).hostname,
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax' as const,
        expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
    ],
    origins: [],
  }

  fs.writeFileSync(configuredAuthFile, JSON.stringify(state, null, 2))
})
