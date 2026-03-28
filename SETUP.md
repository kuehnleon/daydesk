# Daydesk Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd daydesk
npm install
```

### 2. Set Up Auth0

1. Go to https://auth0.com and create a free account
2. Create a new **Regular Web Application**
3. In the application settings:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback/auth0`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
   - Save changes

4. Copy these values from the "Basic Information" section:
   - Domain (e.g., `dev-abc123.us.auth0.com`)
   - Client ID
   - Client Secret

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Auth0 credentials
```

Your `.env` should look like:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
AUTH0_CLIENT_ID="your-auth0-client-id"
AUTH0_CLIENT_SECRET="your-auth0-client-secret"
AUTH0_ISSUER="https://your-domain.auth0.com"
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
  AUTH0_CLIENT_ID: "your-production-client-id"
  AUTH0_CLIENT_SECRET: "your-production-client-secret"
  AUTH0_ISSUER: "https://your-domain.auth0.com"
EOF
```

2. Install with Helm:

```bash
helm upgrade --install daydesk ./helm -f ./helm/values.local.yaml
```

#### Update Auth0 for Production

In your Auth0 application settings, add:
- **Allowed Callback URLs**: `https://daydesk.yourdomain.com/api/auth/callback/auth0`
- **Allowed Logout URLs**: `https://daydesk.yourdomain.com`
- **Allowed Web Origins**: `https://daydesk.yourdomain.com`

### Option 2: Docker Compose (Development/Testing)

```bash
# Add Auth0 credentials to .env file
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
- Check that your Auth0 Allowed Callback URLs matches exactly
- For local development: `http://localhost:3000/api/auth/callback/auth0`
- For production: `https://your-domain.com/api/auth/callback/auth0`

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
- **Export**: CSV reports for tax filing
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
- **Auth**: NextAuth.js v5 + Auth0
- **Styling**: TailwindCSS
- **Deployment**: Docker + Helm for K8s

## Support

For issues or questions:
- Check the README.md
- Review Auth0 documentation
- Check Prisma documentation for database issues
