# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.12.7] - 2026-04-16

### Miscellaneous

- Trim whitespace and center icon in svg logos

## [0.12.6] - 2026-04-16

### Miscellaneous

- Bump dompurify from 3.3.3 to 3.4.0 (#22)

## [0.12.5] - 2026-04-15

### Fixed

- Clear all attendance reminder notifications when attendance is logged

## [0.12.4] - 2026-04-13

### Miscellaneous

- Crop svg logos

## [0.12.3] - 2026-04-13

### Miscellaneous

- Fix vulnerability with npm audit fix

## [0.12.2] - 2026-04-13

### Miscellaneous

- Bump next from 16.2.1 to 16.2.3 (#20)
- Bump next-intl from 4.8.3 to 4.9.1 (#19)
- Bump react from 19.2.4 to 19.2.5 (#21)

## [0.12.1] - 2026-04-10

### Added

- Show logged-in user on settings page

### Fixed

- Derive logout redirect origin from forwarded headers

### Miscellaneous

- Bump @swc/core from 1.15.21 to 1.15.24 (#13)
- Limit failed job history and add TTL to cronjob

## [0.12.0] - 2026-04-10

### Added

- Add onboarding wizard for first-time users

### Fixed

- Logout issues

### Miscellaneous

- Bump vite from 8.0.3 to 8.0.8 (#18)
- Bump defu from 6.1.4 to 6.1.6 (#12)
- Bump @types/node from 24.12.0 to 24.12.2 (#15)

## [0.11.0] - 2026-04-10

### Added

- Replace browser confirm() with custom confirmation dialog
- Add location/transport mapping step to CSV import
- Expand haptic feedback across all key interactions
- Surface day notes in calendar modal, grid, and dashboard

### Fixed

- Enable PWA offline support with fallback page
- Replace parseISO with new Date to prevent off-by-one date errors
- Derive logout redirect URL from request origin instead of env vars
- Remove note icon from dashboard, show as plain text

## [0.10.0] - 2026-04-03

### Added

- Add drag-and-drop reordering for locations and transports in settings
- Add visibility toggle for dashboard attendance buttons
- Add haptic feedback on attendance logging and calendar day selection

## [0.9.4] - 2026-04-03

### Fixed

- Skip push notifications on public holidays

## [0.9.3] - 2026-04-02

### Fixed

- Prevent outside-click handler from closing attendance modal

## [0.9.2] - 2026-04-01

### Fixed

- Remove prepare script and document pre-commit setup in README

## [0.9.0] - 2026-04-01

### Changed

- Split calendar and settings pages into focused sub-components

### Fixed

- Override effect to 3.20.0 to resolve CVE-2026-32887
- Harden security (CSP header, timing-safe auth, secure cookies, k8s contexts)
- Require authentication on countries, holidays, and vapid-key endpoints
- Skip pre-commit install in CI environments
- Show unified skeleton until all data is loaded on settings and calendar pages

### Miscellaneous

- Add top-level permissions to build workflow
- Add pre-commit hooks for secret scanning and linting

## [0.8.0] - 2026-03-31

### Added

- Display app version on settings page
- Add i18n support with EN/DE translations using next-intl

### Miscellaneous

- Add .npmrc to resolve next-intl peer dep conflict with TS 6
- Downgrade typescript from 6.x to 5.8 for ecosystem compatibility

## [0.7.0] - 2026-03-31

### Added

- Add multi-country public holiday support
- Add swipe gesture to navigate months on mobile calendar

### Documentation

- Update README and remove tax reporting claims

### Fixed

- Pass route context in tests for TypeScript 6 compatibility
- Prevent horizontal scroll and overscroll bounce on mobile
- Improve mobile touch handling for calendar day selection
- Prevent swipe gesture from triggering day selection modal

### Miscellaneous

- Configure dependabot to use conventional commits

## [0.6.3] - 2026-03-30

### Added

- Auto-generate changelog with git-cliff in release workflow

## [0.6.2] - 2026-03-30

### Added

- Add structured logging with pino for all API routes

### Miscellaneous

- Do not surpress curl logs of cron job

## [0.6.1] - 2026-03-30

### Miscellaneous

- Remove temporary enabled allowDangerousEmailAccountLinking

## [0.6.0] - 2026-03-30

### Changed

- Make authentication provider-agnostic via generic OIDC (#11)

### Documentation

- Prepare repository for open-source release

## [0.5.3] - 2026-03-30

### Added

- Add check icon to selected attendance type in day modal

### Changed

- Replace check icons with ring highlight for selected attendance

## [0.5.2] - 2026-03-30

### Fixed

- Show overridden transport method in day modal
- Store null instead of 0 for empty location distance

## [0.5.1] - 2026-03-29

### Added

- Replace calendar icons with color legend on mobile

### Fixed

- Prevent stale data after settings changes
- Make navbar sticky to fill iOS safe area on scroll

## [0.5.0] - 2026-03-29

### Added

- Improve mobile PWA UX and visual redesign (#4)

## [0.4.0] - 2026-03-29

### Added

- Enhance push notifications and store in separate DB table (#3)

## [0.3.1] - 2026-03-28

### Fixed

- Web push notifications (#2)

## [0.3.0] - 2026-03-28

### Added

- Add server-side web push notifications (#1)

## [0.2.3] - 2026-03-28

### Fixed

- Trigger build workflow on tags and PRs only

## [0.2.2] - 2026-03-28

### Fixed

- Skip CI on release version bump commit
- Adjust helm values to use correct image registry

### Performance

- Remove Docker build layer cache

## [0.2.1] - 2026-03-28

### Fixed

- Use useSyncExternalStore for online status hook
- Use PAT for release workflow to trigger build pipeline

## [0.2.0] - 2026-03-28

### Added

- Add GitHub release with changelog and artifact links
- Add CSV import with preview and validation
- Add offline support with IndexedDB queue and background sync

## [0.1.1] - 2026-03-28

### Fixed

- Fix sign-out issues

## [0.1.0] - 2026-03-25

### Fixed

- Fix next auth and middleware

[0.12.7]: https://github.com/kuehnleon/daydesk/compare/v0.12.6...v0.12.7
[0.12.6]: https://github.com/kuehnleon/daydesk/compare/v0.12.5...v0.12.6
[0.12.5]: https://github.com/kuehnleon/daydesk/compare/v0.12.4...v0.12.5
[0.12.4]: https://github.com/kuehnleon/daydesk/compare/v0.12.3...v0.12.4
[0.12.3]: https://github.com/kuehnleon/daydesk/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/kuehnleon/daydesk/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/kuehnleon/daydesk/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/kuehnleon/daydesk/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/kuehnleon/daydesk/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/kuehnleon/daydesk/compare/v0.9.4...v0.10.0
[0.9.4]: https://github.com/kuehnleon/daydesk/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/kuehnleon/daydesk/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/kuehnleon/daydesk/compare/v0.9.1...v0.9.2
[0.9.0]: https://github.com/kuehnleon/daydesk/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/kuehnleon/daydesk/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/kuehnleon/daydesk/compare/v0.6.3...v0.7.0
[0.6.3]: https://github.com/kuehnleon/daydesk/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/kuehnleon/daydesk/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/kuehnleon/daydesk/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/kuehnleon/daydesk/compare/v0.5.3...v0.6.0
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
