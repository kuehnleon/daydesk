# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.3] - 2026-03-30

### Changed

- Replace check icons with ring highlight for selected attendance type

## [0.5.2] - 2026-03-30

### Fixed

- Store null instead of 0 for empty location distance
- Show overridden transport method in day modal

## [0.5.1] - 2026-03-29

### Fixed

- Make navbar sticky to fill iOS safe area on scroll
- Prevent stale data after settings changes

### Changed

- Replace calendar icons with color legend on mobile

## [0.5.0] - 2026-03-29

### Changed

- Improve mobile PWA UX and visual redesign
- Add design token system
- Add safe area support and responsive spacing

## [0.4.0] - 2026-03-29

### Added

- Enhanced push notifications with dedicated database table
- Reminders CRUD API with browser timezone support
- Timezone-aware push delivery

## [0.3.1] - 2026-03-28

### Fixed

- Web push notification key encoding
- Auto-subscribe to push when permission already granted

## [0.3.0] - 2026-03-28

### Added

- Server-side web push notifications
- Helm CronJob and VAPID secrets for push notifications
- Push notification API routes and database schema

## [0.2.3] - 2026-03-28

### Fixed

- Trigger build workflow on tags and PRs only

## [0.2.2] - 2026-03-28

### Fixed

- Adjust Helm values to use correct image registry
- Skip CI on release version bump commit

### Changed

- Remove Docker build layer cache

## [0.2.1] - 2026-03-28

### Fixed

- Use PAT for release workflow to trigger build pipeline
- Use useSyncExternalStore for online status hook

## [0.2.0] - 2026-03-28

### Added

- Offline support with IndexedDB queue and background sync
- CSV import with preview and validation
- GitHub release with changelog and artifact links
- DIRECT_URL support for Prisma with connection poolers

### Changed

- Move Helm chart OCI path to ghcr.io
- Add tag-only Docker builds and manual release workflow
- Update GitHub Actions to Node.js 24 runtime

## [0.1.1] - 2026-03-28

### Added

- Test framework and critical path tests
- Zod input validation to all API routes
- Error boundary for rendering errors
- Lint step to CI pipeline
- Security headers
- Database connectivity check to health endpoint

### Changed

- Refactor Helm chart to professional conventions
- Cache Prisma singleton in all environments
- Use session user ID directly, eliminate redundant DB lookups
- Add Cache-Control headers to read-only API responses
- Add query limit to export endpoint to prevent OOM
- Return 201 Created for POST endpoints

### Fixed

- Holiday cache memory leak with eviction and size cap
- WCAG violation: allow user zoom on mobile
- Lint errors and replace any types in export route
- Notifications by using service worker showNotification API
- Drag selection including non-working days in calendar

## [0.1.0] - 2026-03-25

### Added

- Multi-user attendance tracking with Auth0 authentication
- Quick-log dashboard with one-tap buttons
- Calendar view with multi-day selection and monthly summary
- German public holidays for all 16 states via Nager.Date API
- CSV export for tax reports
- PWA support (installable on mobile and desktop)
- Configurable transport methods and custom locations
- Statistics page with attendance analytics
- Docker and Helm chart for Kubernetes deployment
- PostgreSQL database with Prisma ORM
- Offline support with service worker

[0.5.3]: https://github.com/kuehnleon/daydesk/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/kuehnleon/daydesk/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/kuehnleon/daydesk/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/kuehnleon/daydesk/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/kuehnleon/daydesk/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/kuehnleon/daydesk/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/kuehnleon/daydesk/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/kuehnleon/daydesk/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/kuehnleon/daydesk/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/kuehnleon/daydesk/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/kuehnleon/daydesk/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/kuehnleon/daydesk/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/kuehnleon/daydesk/releases/tag/v0.1.0
