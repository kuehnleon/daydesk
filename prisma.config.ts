import { defineConfig } from 'prisma/config'

/**
 * Prisma 7 no longer accepts `url` / `directUrl` in `schema.prisma`.
 * The CLI (migrate, db push, studio) reads its connection string from here.
 * The application runtime uses the pg driver adapter in `src/lib/db.ts`.
 *
 * `DIRECT_URL` is preferred when set (Supabase/PgBouncer setups use it for
 * migrations while the app talks to the pooled `DATABASE_URL`).
 *
 * NOTE: `dotenv` is intentionally NOT imported here. It's a devDep and would
 * crash the production runtime image. The Prisma CLI loads `.env` natively
 * for local development, and in production env vars come from the
 * Kubernetes secret via envFrom.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
})
