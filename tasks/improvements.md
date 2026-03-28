# Daydesk Improvements Roadmap

## Priority 0 — Critical

| # | Item | Effort | Status |
|---|------|--------|--------|
| 1 | Add Zod input validation to API routes | Medium | Done |
| 2 | Add security headers middleware | Low | Done |
| 3 | Add test framework + critical path tests | High | Done |

## Priority 0.5 — Performance (K8s Resource Optimization)

| # | Item | Effort | Status |
|---|------|--------|--------|
| P1 | Use session user ID directly — eliminate redundant DB lookups | Low | Done |
| P2 | Fix holiday cache memory leak — bound the Map | Low | Done |
| P3 | Add DB connectivity check to health endpoint | Low | Done |
| P4 | Cache Prisma singleton in all environments | Low | Done |
| P5 | Add Cache-Control headers to read-only API responses | Low | Done |
| P6 | Add query limit to export endpoint to prevent OOM | Low | Done |

## Priority 1 — Important

| # | Item | Effort | Status |
|---|------|--------|--------|
| 4 | Add lint/test to CI pipeline | Low | Done |
| 5 | Add pagination to attendance queries | Medium | Pending |
| 6 | Split large page components | Medium | Pending |
| 7 | Fix accessibility (viewport, keyboard, focus traps) | Medium | Partial (viewport fixed) |

## Priority 2 — Moderate

| # | Item | Effort | Status |
|---|------|--------|--------|
| 8 | Adopt SWR/React Query for data fetching | Medium | Pending |
| 9 | Add error boundaries | Low | Done |
| 10 | Replace `any` types with proper types in export | Low | Done |
| 11 | Add i18n (EN/DE) | Medium | Pending |

## Priority 3 — Nice to Have

| # | Item | Effort | Status |
|---|------|--------|--------|
| 12 | Offline support / background sync | High | Done |
| 13 | CSV import | Medium | Done |
| 14 | Team/manager view | High | Skipped |

---

## Detailed Descriptions

### 1. Add Zod Input Validation to API Routes
No validation library — all validation is manual and incomplete. Date formats, color hex values, enum types, distances are all unvalidated. Add Zod schemas for every API route.

### 2. Add Security Headers Middleware
No CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. No middleware.ts at all. Add a Next.js middleware with security headers.

### 3. Add Test Framework + Critical Path Tests
Zero test files, no testing framework configured. Add Vitest + Testing Library for unit/component tests.

### 4. Add Lint/Test to CI Pipeline
ESLint configured but not run in CI. GitHub Actions only builds Docker/Helm. Add lint step to workflow.

### P1. Use Session User ID Directly
JWT callback already puts user.id in session. Every API route was doing an extra DB lookup via findUnique just to get the user ID. Removed all redundant queries — ~50% fewer DB calls per request.

### P2. Fix Holiday Cache Memory Leak
In-memory Map for holiday data grew unbounded. Added TTL-based eviction and size cap (10 entries) to prevent memory growth in long-running K8s pods.

### P3. Add DB Connectivity Check to Health Endpoint
K8s liveness/readiness probes were passing even when Postgres was down. Health endpoint now does `SELECT 1` and returns 503 if unreachable.

### P4. Cache Prisma Singleton in All Environments
PrismaClient was only cached on globalThis in development. Now cached unconditionally per Prisma's recommendation.

### P5. Add Cache-Control Headers to Read-Only API Responses
No caching headers on any responses. Added appropriate Cache-Control: public 24h for holidays, private 60s for locations/transports/settings, private no-cache for attendance.

### P6. Add Query Limit to Export Endpoint
Export fetched all attendances with no limit. Added `take: 3660` safety cap to prevent OOM in the 512Mi container.

### 5. Add Pagination to Attendance Queries
All attendance queries return unbounded results. Will degrade with years of data. Add cursor or offset-based pagination.

### 6. Split Large Page Components
calendar/page.tsx (790 lines), settings/page.tsx (635 lines), statistics/page.tsx (427 lines) are too large. Extract into focused sub-components.

### 7. Fix Accessibility
- Remove `maximumScale: 1` and `userScalable: false` from viewport
- Add keyboard navigation to calendar
- Implement focus traps in modals
- Add ARIA labels to color picker buttons

### 8. Adopt SWR/React Query
Raw fetch + useState + useEffect everywhere. No request deduplication, cache invalidation, retry logic, or optimistic updates.

### 9. Add Error Boundaries
If a component throws during render, the whole page crashes. Add React error boundaries around major sections.

### 10. Replace `any` Types in Export
`generateCSV(attendances: any[])`, `generatePDF(attendances: any[], ...)` — weakest type safety. Define proper types from Prisma.

### 11. Add i18n (EN/DE)
Everything hardcoded in English despite the German-tax focus. Add next-intl with EN/DE translations.

### 12. Offline Support
PWA is set up but no offline data entry. Queue entries in IndexedDB when offline, sync when back online.

### 13. CSV Import
Export exists but no import. Users can't bulk-load historical data.

### 14. Team/Manager View
Currently single-user only. Add optional team features with role-based access.
