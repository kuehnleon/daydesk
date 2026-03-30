# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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

### Miscellaneous

- Update improvements roadmap for priority 3 items

## [0.1.1] - 2026-03-28

### Fixed

- Fix sign-out issues

## [0.1.0] - 2026-03-25

### Fixed

- Fix next auth and middleware

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
