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

## Translations (i18n)

daydesk uses [next-intl](https://next-intl.dev) for internationalization. Translation files live in the `messages/` directory as JSON files, one per locale (e.g. `messages/en.json`, `messages/de.json`).

### Improving existing translations

1. Open the translation file (e.g. `messages/de.json`)
2. Find the key you want to improve — keys are organized by namespace (e.g. `nav`, `dashboard`, `calendar`, `settings`)
3. Update the value
4. Run `npm run build` to verify no keys are broken

### Adding a new language

All locale configuration is centralized in **`src/i18n/config.ts`** — this is the single source of truth. Adding a new language requires changes in just two places:

1. **Create the translation file:**
   ```bash
   cp messages/en.json messages/<locale>.json
   # e.g. cp messages/en.json messages/fr.json
   ```
   Translate all values in the new file. Keep the keys identical — only change the values. Some strings use [ICU message format](https://next-intl.dev/docs/usage/messages#icu-syntax) for plurals:
   ```json
   "attendanceSaved": "Attendance saved for {count, plural, one {# day} other {# days}}!"
   ```
   Make sure to translate the plural branches for your language.

2. **Register the locale** in `src/i18n/config.ts`:
   ```typescript
   import { enUS, de, fr } from 'date-fns/locale'

   export const locales = ['en', 'de', 'fr'] as const

   export const dateFnsLocales: Record<Locale, DateFnsLocale> = {
     en: enUS,
     de: de,
     fr: fr,
   }
   ```
   This automatically propagates to the proxy, validation schemas, and date formatting.

3. **Add the language option** to the Settings page language selector in `src/app/settings/page.tsx`:
   ```tsx
   <option value="fr">{t('french')}</option>
   ```
   And add the corresponding label key (e.g. `"french": "Français"`) to the `settings` namespace in **every** existing translation file.

6. **Verify:**
   ```bash
   npm run build
   npm test
   ```

### Translation guidelines

- Keep translations concise — UI space is limited, especially on mobile
- Preserve placeholders like `{count}`, `{date}`, `{time}` exactly as-is
- Preserve ICU plural syntax (`{count, plural, one {…} other {…}}`)
- Test your translations in the app (Settings → Language) to check for layout issues

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md). Do **not** open a public issue for security concerns.
