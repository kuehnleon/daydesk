import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrisma(): PrismaClient {
  // Prisma 7 requires a driver adapter — the schema no longer holds the URL.
  // @prisma/adapter-pg accepts a connection string, a pg.PoolConfig, or a Pool.
  const adapter = new PrismaPg(process.env.DATABASE_URL ?? '')
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
