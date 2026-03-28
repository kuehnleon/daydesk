# Daydesk - Office Attendance Tracker

A lightweight multi-user application for tracking office and home office attendance for German tax reporting.

## Features

- **Quick Logging**: One-tap buttons to log today's attendance
- **Calendar View**: Visual month view to log/edit past days
- **German Public Holidays**: Automatic fetching via Nager.Date API for all 16 states
- **Export Reports**: CSV and PDF exports with date range selection
- **Multi-user**: Each user has their own attendance records
- **PWA Support**: Install on iPhone/macOS home screen
- **Auth0 Authentication**: Secure user authentication

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma + SQLite
- NextAuth.js v5 + Auth0
- TailwindCSS
- PWA (installable)

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Auth0 account (free tier)

### Auth0 Setup

1. Create a free Auth0 account at https://auth0.com
2. Create a new **Regular Web Application**
3. Configure the following settings:

   **Allowed Callback URLs:**
   ```
   http://localhost:3000/api/auth/callback/auth0
   ```

   **Allowed Logout URLs:**
   ```
   http://localhost:3000
   ```

   **Allowed Web Origins:**
   ```
   http://localhost:3000
   ```

4. Copy your credentials:
   - Domain (e.g., `your-tenant.auth0.com`)
   - Client ID
   - Client Secret

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
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

4. Update `.env` with your Auth0 credentials:
   ```
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"

   APP_BASE_URL=http://localhost:3000
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_SECRET=generate-a-random-secret
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

### Generate AUTH0_SECRET

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
  AUTH0_CLIENT_ID: "your-client-id"
  AUTH0_CLIENT_SECRET: "your-client-secret"
  AUTH0_ISSUER: "https://your-domain.auth0.com"

ingress:
  enabled: true
  host: daydesk.your-domain.com
EOF

# Install/upgrade
helm upgrade --install daydesk . -f values.local.yaml
```

### Update Auth0 for Production

In your Auth0 application settings, add production URLs:

**Allowed Callback URLs:**
```
https://daydesk.your-domain.com/api/auth/callback/auth0
```

**Allowed Logout URLs:**
```
https://daydesk.your-domain.com
```

**Allowed Web Origins:**
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

## License

MIT
