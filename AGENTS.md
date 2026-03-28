<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commit Convention
Use **Conventional Commits** format. This is required — release notes are auto-generated from commit messages.

Format: `<type>: <description>`

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`

Rules:
- Use lowercase, no period at the end
- Keep the description concise (under 72 chars)
- Use imperative mood ("add" not "added")

Examples:
- `feat: add dark mode toggle to settings`
- `fix: correct timezone offset in attendance export`
- `chore: update dependencies to latest versions`
