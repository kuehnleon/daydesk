# End-to-End Tests

Browser-driven tests using [Playwright](https://playwright.dev/) that exercise the real Next.js app against a real Postgres database.

Layered on top of the existing Vitest unit tests (`npm test`) — this suite catches integration regressions the unit tests can't see.

## Running locally

```bash
# 1. Start Postgres (the docker-compose service is fine — no need to start the app)
docker compose up -d postgres

# 2. Fill in throwaway VAPID keys in .env.test (one-time, values stay local).
#    `next build` validates them as real P-256 keys.
node -e "const k=require('web-push').generateVAPIDKeys();\
         console.log('VAPID_PUBLIC_KEY='+k.publicKey);\
         console.log('VAPID_PRIVATE_KEY='+k.privateKey)"
# → paste both lines into .env.test, replacing the empty values.

# 3. Run the suite (Playwright starts `next dev` on port 3100 automatically,
#    loading .env.test — your real .env is temporarily shrouded for the run)
npm run test:e2e
```

Useful variants:

| Command | What it does |
|---|---|
| `npm run test:e2e` | Headless run, HTML report opens on failure. |
| `npm run test:e2e:ui` | Interactive UI mode — pick a test, watch it drive the browser. |
| `npm run test:e2e:debug` | Debug mode with the Playwright inspector. |
| `PLAYWRIGHT_USE_BUILD=1 npm run test:e2e` | Test against `next build && next start` (matches CI). |
| `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e` | Use an already-running server. |

## Structure

```
e2e/
├── fixtures/
│   ├── auth.ts     Mint next-auth JWT cookies (bypasses OIDC in tests)
│   ├── db.ts       Prisma client + resetDb() for a clean DB per suite
│   ├── seed.ts     createUser, seedAttendance, seedLocation, seedTransport
│   ├── i18n.ts     t('nav.dashboard') → 'Dashboard' (reads messages/en.json)
│   └── test.ts     Base `test` with { user, authedPage } fixtures
├── pages/          Page-Object-Model wrappers (thin locator bundles)
├── tests/          Actual specs — one file per feature area
├── auth.setup.ts   Bootstraps the "configured" user + storageState
├── global-setup.ts Runs `prisma db push`/`migrate deploy` + initial reset
└── global-teardown.ts
```

## Authentication in tests

The app authenticates via OIDC, so we cannot log in through the UI in a test.
Instead, tests **mint a signed `next-auth` JWT** using the same `NEXTAUTH_SECRET`
the server uses, then inject it as the `next-auth.session-token` cookie.
The middleware/API handlers accept it exactly like a real session.

No production code changes were needed to enable this — see `e2e/fixtures/auth.ts`.

## Selectors

Follows [Playwright best practices](https://playwright.dev/docs/best-practices#use-locators):
1. `getByRole` / `getByLabel` / `getByText` first — resilient to layout changes.
2. `t('key.path')` for user-facing strings so tests don't break on copy edits.
3. `data-testid` only where nothing else works well (calendar cells, etc.).
   Introduce them **incrementally, only when a test needs one** — no bulk sprinkling.

## Adding a test

1. If a suitable Page Object doesn't exist, add one in `e2e/pages/`.
2. Import `test` from `../fixtures/test` — it gives you `authedPage` and `user`.
3. If the assertion needs DB state, import `prisma` from `../fixtures/db`.
4. Prefer asserting user-visible behaviour; use API/DB assertions when the UI signal is fragile.

## CI

The `e2e` job in `.github/workflows/build.yml` runs on every PR:
Postgres service → `npx playwright install chromium` → `npm run test:e2e`.
On failure it uploads `playwright-report/` and `test-results/` as artifacts.
