/**
 * Seed helpers for E2E tests. Small, composable, and DB-only — they
 * bypass the app entirely.
 */
import { prisma } from './db'

export interface SeededUser {
  id: string
  email: string
  name: string
}

export async function createUser(overrides: Partial<{
  email: string
  name: string
  country: string
  defaultState: string
  locale: string
  onboardingCompleted: boolean
}> = {}): Promise<SeededUser> {
  const suffix = Math.random().toString(36).slice(2, 8)
  const email = overrides.email ?? `test-${suffix}@example.test`
  const user = await prisma.user.create({
    data: {
      email,
      name: overrides.name ?? 'Test User',
      country: overrides.country ?? 'DE',
      defaultState: overrides.defaultState ?? 'BW',
      locale: overrides.locale ?? 'en',
      onboardingCompleted: overrides.onboardingCompleted ?? true,
    },
  })
  return { id: user.id, email: user.email, name: user.name ?? 'Test User' }
}

export async function seedTransport(userId: string, name: string, sortOrder = 0) {
  return prisma.transport.create({ data: { userId, name, sortOrder } })
}

export async function seedLocation(userId: string, name: string, opts: Partial<{
  color: string
  transportId: string | null
  distance: number
  sortOrder: number
}> = {}) {
  return prisma.location.create({
    data: {
      userId,
      name,
      color: opts.color ?? '#3B5BDB',
      transportId: opts.transportId ?? null,
      distance: opts.distance ?? null,
      sortOrder: opts.sortOrder ?? 0,
    },
  })
}

export async function seedAttendance(userId: string, date: Date, type: string, opts: Partial<{
  locationId: string | null
  transportId: string | null
  notes: string | null
}> = {}) {
  return prisma.attendance.create({
    data: {
      userId,
      date,
      type,
      locationId: opts.locationId ?? null,
      transportId: opts.transportId ?? null,
      notes: opts.notes ?? null,
    },
  })
}
