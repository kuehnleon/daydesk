# End-to-End Tests

Browser-driven tests using [Playwright](https://playwright.dev/) that exercise the real Next.js app against a real Postgres database. Complements the existing Vitest unit + component tests (`npm test`) — this suite catches integration and visual regressions those can't see.

## Test layers

| Layer | Where | What it covers |
|---|---|---|
| **Unit / API-route** (Vitest) | `src/**/__tests__/`, `src/**/*.test.ts` | Pure functions, API handlers (with `prisma` mocked) |
| **Component / hook** (Vitest + RTL) | `src/**/*.test.tsx` | UI primitives, onboarding steps, custom hooks with `renderHook` |
| **E2E** (Playwright) | `e2e/tests/*.spec.ts` | Full auth → page → API → DB flows in a real browser |
| **Visual regression** (Playwright snapshots) | `e2e/tests/visual-regression.spec.ts` | Screenshot comparisons across theme × locale × viewport |

## Running locally

You need a Postgres instance the tests can wipe and repopulate. Everything is
wired up in the repo's `docker-compose.yml` under an `e2e` profile so it can
coexist with the dev database on the same host.

```bash
# 1. Start the e2e test Postgres (published on host port 5433 so it doesn't
#    clash with the dev DB on 5432).
docker compose --profile e2e up -d postgres-e2e
# `--profile e2e up -d` (without a service name) works too — postgres-e2e is
# the only profile-tagged service — but it also spins up the profile-less
# `postgres` and `app` services, which is usually not what you want for a
# test run.
#
# Stop + wipe with:
#   docker compose --profile e2e rm -f -s postgres-e2e

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

**Skip visual regression during quick iteration:**
```bash
npm run test:e2e -- --grep-invert visual
```

## Visual regression

The `visual-regression.spec.ts` file generates a matrix of screenshots:

- **4 pages** — `/dashboard`, `/calendar`, `/statistics`, `/settings`
- **2 themes** — `light`, `dark` (`prefers-color-scheme` via Playwright's `colorScheme`)
- **2 locales** — `en`, `de` (`NEXT_LOCALE` cookie)
- **2 viewports** — desktop 1280×720, mobile 390×844

= **32 snapshots**, checked into `e2e/tests/visual-regression.spec.ts-snapshots/`.

**Baselines are Linux-only.** Pixel comparisons don't survive OS boundaries, so baselines are generated inside the official Playwright Docker image (same as CI). Two helper scripts under `e2e/scripts/`:

```bash
# Regenerate all baselines (writes to the snapshots dir).
# Prereq: Docker running + `daydesk-e2e-pg` postgres container on the
# `daydesk-e2e` network — see the script header.
./e2e/scripts/generate-visual-baselines.sh

# Verify the current UI matches the committed baselines.
./e2e/scripts/verify-visual-baselines.sh
```

**When a visual diff is real** (intentional UI change), regenerate baselines and commit the PNGs. **When it's flake** (rare — the setup is fairly hardened), just rerun.

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
├── scripts/        generate-/verify-visual-baselines.sh (Linux snapshot infra)
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
3. `data-testid` only where nothing else works well. Currently used exclusively
   for `data-date` on calendar day cells (a machine-friendly hook parallel
   to the localized `aria-label`).

## Adding a test

1. If a suitable Page Object doesn't exist, add one in `e2e/pages/`.
2. Import `test` from `../fixtures/test` — it gives you `authedPage` and `user`.
3. If the assertion needs DB state, import `prisma` from `../fixtures/db`.
4. Prefer asserting user-visible behaviour; use API/DB assertions when the UI signal is fragile.

## CI

The `e2e` job in `.github/workflows/build.yml` runs on every PR:
Postgres service → `npx playwright install chromium` → `npm run test:e2e`.
On failure it uploads `playwright-report/` and `test-results/` as artifacts
(traces, screenshots, videos, and visual-regression diff PNGs).
