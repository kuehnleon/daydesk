# Contributing to daydesk

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/daydesk.git
   cd daydesk
   ```
3. Follow the setup instructions in [SETUP.md](SETUP.md)

## Development Workflow

1. Create a feature branch from `master`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes
3. Run the linter:
   ```bash
   npm run lint
   ```
4. Run tests:
   ```bash
   npm test
   ```
5. Commit using [Conventional Commits](#commit-convention) format
6. Push and open a Pull Request against `master`

## Commit Convention

This project uses **Conventional Commits**. Release notes are auto-generated from commit messages.

Format: `<type>: <description>`

| Type | Purpose |
|------|---------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `refactor` | Code change (no bug fix or new feature) |
| `chore` | Maintenance (deps, CI, config) |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `perf` | Performance improvement |

Rules:
- Lowercase, no period at the end
- Under 72 characters
- Imperative mood ("add" not "added")

Examples:
- `feat: add dark mode toggle to settings`
- `fix: correct timezone offset in attendance export`

## Code Style

- **TypeScript** throughout the codebase
- **ESLint** for linting — run `npm run lint` before committing
- **TailwindCSS** for styling
- **Zod** for runtime validation on API routes

## Testing

- Run `npm test` before submitting a PR
- Add tests for new API routes and critical logic
- Existing tests must not break

## Pull Requests

- Keep PRs focused on a single concern
- Provide a clear description of what changed and why
- Reference related issues if applicable
- Ensure CI checks pass (lint + tests)

## Reporting Bugs

Open a [GitHub issue](https://github.com/kuehnleon/daydesk/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information if relevant

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md). Do **not** open a public issue for security concerns.
