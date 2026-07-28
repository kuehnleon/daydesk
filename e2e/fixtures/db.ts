/**
 * Prisma client + database helpers used from Playwright tests.
 *
 * Tests import `prisma` here (NOT `@/lib/db`) so we don't hold two clients
 * pointing at the same DB via different pool configs.
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { __e2ePrisma?: PrismaClient }

export const prisma =
  globalForPrisma.__e2ePrisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === '1' ? ['query', 'error', 'warn'] : ['error'],
  })

if (!globalForPrisma.__e2ePrisma) globalForPrisma.__e2ePrisma = prisma

/**
 * Truncate all application tables. Order-independent because we use
 * TRUNCATE ... CASCADE. Fast enough to call before every test.
 */
export async function resetDb() {
  // Keep this list aligned with prisma/schema.prisma
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "attendances",
      "locations",
      "transports",
      "reminder_times",
      "push_subscriptions",
      "sessions",
      "accounts",
      "verification_tokens",
      "users"
    RESTART IDENTITY CASCADE;
  `)
}

export async function disconnect() {
  await prisma.$disconnect()
}
