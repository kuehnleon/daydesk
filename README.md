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

A lightweight multi-user application for tracking office and home office attendance.

## Features

- **Quick Logging**: One-tap buttons to log today's attendance with customizable office locations
- **Calendar View**: Visual month view to log/edit past days with color-coded location markers
- **Statistics Dashboard**: Attendance breakdown, office location usage, transport methods, and commute distance tracking
- **Custom Locations & Transports**: Define office locations with colors, distances, and preferred transport methods
- **German Public Holidays**: Automatic fetching via Nager.Date API for all 16 states
- **Export & Import**: CSV and PDF exports with date range selection, plus CSV import
- **Push Notifications**: Optional daily reminders to log attendance via Web Push
- **Multi-user**: Each user has their own attendance records
- **PWA Support**: Installable on any device with offline support and background sync
- **OIDC Authentication**: Works with any OpenID Connect provider (Auth0, Keycloak, Okta, Azure AD, etc.)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma + PostgreSQL
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

4. Generate secrets:
   ```bash
   # Used for session cookie encryption and push API authentication
   openssl rand -hex 32
   ```
   Run this command **twice** — once for `NEXTAUTH_SECRET` and once for `PUSH_API_SECRET`.

5. Update `.env` with your OIDC provider credentials and generated secrets:
   ```
   DATABASE_URL="postgresql://daydesk:daydesk@localhost:5432/daydesk"
   DIRECT_URL="postgresql://daydesk:daydesk@localhost:5432/daydesk"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="<first-generated-secret>"

   APP_BASE_URL=http://localhost:3000
   OAUTH_ISSUER=https://your-tenant.auth0.com
   OAUTH_CLIENT_ID=your-client-id
   OAUTH_CLIENT_SECRET=your-client-secret
   ```

   For push notifications (optional), also add:
   ```
   PUSH_API_SECRET="<second-generated-secret>"
   VAPID_PUBLIC_KEY="<from-generate-command-below>"
   VAPID_PRIVATE_KEY="<from-generate-command-below>"
   VAPID_SUBJECT="mailto:your-email@example.com"
   ```

   `VAPID_SUBJECT` is a contact URL (typically `mailto:`) that identifies the application server to the browser push service.

   Generate the VAPID key pair with:
   ```bash
   npx web-push generate-vapid-keys
   ```

6. Start a local PostgreSQL instance:
   ```bash
   docker compose up -d postgres
   ```

7. Generate Prisma client and push database schema:
   ```bash
   npm run db:generate
   npm run db:push
   ```

8. Start development server:
   ```bash
   npm run dev
   ```

9. Open http://localhost:3000

## Usage

### Quick Log
- Dashboard shows buttons for each configured office location (with custom colors), plus Home Office, Day Off, and Sick
- Click to log today's attendance instantly

### Calendar
- View/edit any past or future day
- Color-coded by custom location colors, green (home), red (holiday), gray (weekend)
- Click a day to add/edit attendance

### Statistics
- Attendance breakdown by type (office, home, off, holiday, sick)
- Office location usage and transport method distribution
- Commute distance summary (total, average, days tracked)
- Date range presets: this month, last month, this year, or custom range

### Export & Import
- Select date range
- Download CSV or PDF report
- Import attendance data from CSV
- Includes summary statistics

### Settings
- Manage office locations (name, color, distance, default transport)
- Manage transport methods
- Configure your German state (for holiday calculation)
- Set default work days and week start day
- Set up daily reminder notifications (time, timezone, work days only)

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
  DATABASE_URL: "postgresql://user:pass@db-host:5432/daydesk"
  DIRECT_URL: "postgresql://user:pass@db-host:5432/daydesk"
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

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Push Notifications

daydesk can send daily reminders via the [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) to remind users who haven't logged their attendance yet.

### How It Works

1. Users enable notifications in **Settings** and configure reminder times (e.g. 09:00 Europe/Berlin)
2. The browser subscribes to push notifications via the service worker
3. An external cron job calls `POST /api/push/send` every minute
4. The server checks which users have a reminder matching the current time in their timezone, haven't logged attendance today, and have push notifications enabled
5. Matching users receive a browser notification linking to the dashboard

### Triggering Locally

To trigger push notifications during development, send a request to the send endpoint using the `PUSH_API_SECRET`:

```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Authorization: Bearer <your-PUSH_API_SECRET>" \
  -H "Content-Type: application/json"
```

In production, a Kubernetes CronJob handles this automatically (see `helm/templates/cronjob.yaml`).

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
