# daydesk Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd daydesk
npm install
```

### 2. Set Up an OIDC Provider

daydesk works with any OIDC-compliant identity provider. Configure a "Web Application" in your provider with:

- **Allowed Callback URL**: `http://localhost:3000/api/auth/callback/oidc`
- **Allowed Logout URL**: `http://localhost:3000`

You need these values from your provider:

- **Issuer URL** (must expose `/.well-known/openid-configuration`)
- **Client ID**
- **Client Secret**

<details>
<summary><strong>Auth0 Example</strong></summary>

1. Go to https://auth0.com and create a free account
2. Create a new **Regular Web Application**
3. In the application settings:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback/oidc`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
   - Save changes
4. Copy these values from the "Basic Information" section:
   - Domain → use as `OAUTH_ISSUER` with `https://` prefix (e.g. `https://dev-abc123.us.auth0.com`)
   - Client ID → `OAUTH_CLIENT_ID`
   - Client Secret → `OAUTH_CLIENT_SECRET`
</details>

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OIDC provider credentials
```

Your `.env` should look like:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
OAUTH_ISSUER="https://your-tenant.auth0.com"
OAUTH_CLIENT_ID="your-oauth-client-id"
OAUTH_CLIENT_SECRET="your-oauth-client-secret"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Initialize Database

```bash
npm run db:generate
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 and sign in!

## Production Deployment

### Option 1: Docker + Kubernetes with Helm

#### Build Docker Image

```bash
docker build -t your-registry/daydesk:1.0.0 .
docker push your-registry/daydesk:1.0.0
```

#### Deploy with Helm

1. Create custom values file:

```bash
cat > helm/values.local.yaml <<EOF
image:
  repository: your-registry/daydesk
  tag: "1.0.0"

ingress:
  enabled: true
  host: daydesk.yourdomain.com
  tls:
    enabled: true
    secretName: daydesk-tls

env:
  DATABASE_URL: "file:/data/daydesk.db"
  NEXTAUTH_URL: "https://daydesk.yourdomain.com"
  NEXTAUTH_SECRET: "$(openssl rand -base64 32)"
  OAUTH_CLIENT_ID: "your-production-client-id"
  OAUTH_CLIENT_SECRET: "your-production-client-secret"
  OAUTH_ISSUER: "https://your-tenant.auth0.com"
EOF
```

2. Install with Helm:

```bash
helm upgrade --install daydesk ./helm -f ./helm/values.local.yaml
```

#### Update OIDC Provider for Production

In your OIDC provider settings, add:
- **Allowed Callback URL**: `https://daydesk.yourdomain.com/api/auth/callback/oidc`
- **Allowed Logout URL**: `https://daydesk.yourdomain.com`

### Option 2: Docker Compose (Development/Testing)

```bash
# Add OIDC provider credentials to .env file
docker-compose up
```

## PWA Installation

### iOS (iPhone/iPad)
1. Open https://daydesk.yourdomain.com in **Safari**
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

The app will appear on your home screen like a native app!

### macOS
1. Open in Safari
2. File → Add to Dock

### Android/Chrome
1. Open in Chrome
2. Tap menu (⋮)
3. Tap "Install app" or "Add to Home Screen"

## Troubleshooting

### "Invalid callback URL" error
- Check that your OIDC provider's Allowed Callback URLs matches exactly
- For local development: `http://localhost:3000/api/auth/callback/oidc`
- For production: `https://your-domain.com/api/auth/callback/oidc`

### Database errors
```bash
# Reset the database
rm prisma/dev.db
npm run db:push
```

### Build errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Features

- **Quick Log**: Dashboard buttons for instant attendance logging
- **Calendar**: Visual month view with color-coded days
- **Export**: CSV and PDF reports
- **Multi-user**: Each user has separate attendance records
- **German Holidays**: Automatic for all 16 states via Nager.Date API
- **PWA**: Install on any device

## Database Management

### View/Edit Data
```bash
npm run db:studio
```

### Create Migration
```bash
npm run db:migrate
```

### Reset Database
```bash
rm prisma/dev.db
npm run db:push
```

## Architecture

- **Frontend**: Next.js 16 with React Server Components
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma ORM
- **Auth**: NextAuth.js + OIDC
- **Styling**: TailwindCSS
- **Deployment**: Docker + Helm for K8s

## Support

For issues or questions:
- Check the README.md
- Review your OIDC provider's documentation
- Check Prisma documentation for database issues
