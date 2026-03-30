<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/daydesk-logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="public/daydesk-logo-light.svg">
    <img src="public/daydesk-logo-light.svg" alt="daydesk" width="400">
  </picture>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/kuehnleon/daydesk/actions/workflows/build.yml"><img src="https://github.com/kuehnleon/daydesk/actions/workflows/build.yml/badge.svg" alt="Build Status"></a>
  <a href="https://github.com/kuehnleon/daydesk/releases/latest"><img src="https://img.shields.io/github/v/release/kuehnleon/daydesk" alt="Latest Release"></a>
</p>

# daydesk

A lightweight multi-user application for tracking office and home office attendance for German tax reporting.

## Features

- **Quick Logging**: One-tap buttons to log today's attendance
- **Calendar View**: Visual month view to log/edit past days
- **German Public Holidays**: Automatic fetching via Nager.Date API for all 16 states
- **Export Reports**: CSV and PDF exports with date range selection
- **Multi-user**: Each user has their own attendance records
- **PWA Support**: Install on iPhone/macOS home screen
- **OIDC Authentication**: Works with any OpenID Connect provider (Auth0, Keycloak, Okta, Azure AD, etc.)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma + SQLite
- NextAuth.js + OIDC
- TailwindCSS
- PWA (installable)

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- An OIDC-compliant identity provider (e.g. [Auth0](https://auth0.com), [Keycloak](https://www.keycloak.org), [Okta](https://www.okta.com), [Azure AD](https://azure.microsoft.com/en-us/products/active-directory))

### OIDC Provider Setup

daydesk works with **any** OIDC-compliant provider. You need three values from your provider:

- **Issuer URL** — must expose `/.well-known/openid-configuration`
- **Client ID**
- **Client Secret**

Configure a "Web Application" in your provider with:

**Allowed Callback URL:**
```
http://localhost:3000/api/auth/callback/oidc
```

**Allowed Logout URL:**
```
http://localhost:3000
```

Your provider must support the `openid email profile` scopes so that the ID token includes the user's email, name, and picture.

<details>
<summary><strong>Auth0 Example</strong></summary>

1. Create a free Auth0 account at https://auth0.com
2. Create a new **Regular Web Application**
3. Configure the following settings:

   **Allowed Callback URLs:** `http://localhost:3000/api/auth/callback/oidc`

   **Allowed Logout URLs:** `http://localhost:3000`

   **Allowed Web Origins:** `http://localhost:3000`

4. Copy your credentials:
   - Domain → use as `OAUTH_ISSUER` with `https://` prefix (e.g. `https://your-tenant.auth0.com`)
   - Client ID → `OAUTH_CLIENT_ID`
   - Client Secret → `OAUTH_CLIENT_SECRET`

5. For logout support, set `OAUTH_LOGOUT_URL` to:
   ```
   https://your-tenant.auth0.com/v2/logout?client_id=YOUR_CLIENT_ID
   ```
</details>

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/kuehnleon/daydesk.git
   cd daydesk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your OIDC provider credentials:
   ```
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-a-random-secret"

   APP_BASE_URL=http://localhost:3000
   OAUTH_ISSUER=https://your-tenant.auth0.com
   OAUTH_CLIENT_ID=your-client-id
   OAUTH_CLIENT_SECRET=your-client-secret
   ```

5. Generate Prisma client and push database schema:
   ```bash
   npm run db:generate
   npm run db:push
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

7. Open http://localhost:3000

### Generate NEXTAUTH_SECRET

```bash
openssl rand -hex 32
```

## Database Schema

- **User**: email, name, defaultState (German state code), workDays (comma-separated 1-5 for Mon-Fri)
- **Attendance**: date, type (office/home/off/holiday/sick), transport (own_car/company_car/null), notes
- **Account/Session**: NextAuth.js tables for auth

## Usage

### Quick Log
- Dashboard has three buttons: Office (Own Car), Office (Company Car), Home Office
- Click to log today's attendance instantly

### Calendar
- View/edit any past or future day
- Color-coded: Blue (office), Green (home), Red (holiday), Gray (weekend)
- Click a day to add/edit attendance

### Export
- Select date range
- Download CSV or PDF report
- Includes summary statistics

> Both formats are compatible with German tax software.

### Settings
- Configure your German state (for holiday calculation)
- Set default work days

## Kubernetes Deployment

### Build Docker Image

```bash
docker build -t daydesk:latest .
```

### Deploy with Helm

```bash
cd helm

# Create values override file
cat > values.local.yaml <<EOF
env:
  DATABASE_URL: "file:/data/daydesk.db"
  NEXTAUTH_URL: "https://daydesk.your-domain.com"
  NEXTAUTH_SECRET: "your-production-secret"
  OAUTH_CLIENT_ID: "your-client-id"
  OAUTH_CLIENT_SECRET: "your-client-secret"
  OAUTH_ISSUER: "https://your-tenant.auth0.com"

ingress:
  enabled: true
  host: daydesk.your-domain.com
EOF

# Install/upgrade
helm upgrade --install daydesk . -f values.local.yaml
```

### Update OIDC Provider for Production

In your OIDC provider settings, add production URLs:

**Allowed Callback URL:**
```
https://daydesk.your-domain.com/api/auth/callback/oidc
```

**Allowed Logout URL:**
```
https://daydesk.your-domain.com
```

## PWA Installation

### iOS (iPhone/iPad)
1. Open in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### macOS
1. Open in Safari
2. File → Add to Dock

### Android/Chrome
1. Open in Chrome
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home Screen"

## Development

```bash
# Run development server
npm run dev

# Run Prisma Studio (database GUI)
npm run db:studio

# Create database migration
npm run db:migrate

# Build for production
npm run build

# Start production server
npm start
```

## Public Holiday API

Uses [Nager.Date](https://date.nager.at) free API for German public holidays.
- Supports all 16 German states
- Automatically caches results
- No API key required

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

For security issues, see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
