/**
 * Prisma client + database helpers used from Playwright tests.
 *
 * Tests import `prisma` here (NOT `@/lib/db`) so we don't hold two clients
 * pointing at the same DB via different pool configs.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { __e2ePrisma?: PrismaClient }

function createPrisma(): PrismaClient {
  // Prisma 7 requires a driver adapter — same pattern as src/lib/db.ts.
  const adapter = new PrismaPg(process.env.DATABASE_URL ?? '')
  return new PrismaClient({
    adapter,
    log: process.env.PRISMA_LOG === '1' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.__e2ePrisma ?? createPrisma()

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
