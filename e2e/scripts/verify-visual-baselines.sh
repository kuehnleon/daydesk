#!/usr/bin/env bash
# Run the visual regression suite inside the Playwright Docker image to
# compare against committed baselines. Same infra as
# generate-visual-baselines.sh but *without* --update-snapshots.
#
# Usage:  ./e2e/scripts/verify-visual-baselines.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE="mcr.microsoft.com/playwright:v1.62.0-noble"
NETWORK="daydesk-e2e"
PG_HOST="daydesk-e2e-pg"

VAPID_OUT=$(node -e "const k=require('web-push').generateVAPIDKeys(); \
  console.log('VAPID_PUBLIC_KEY='+k.publicKey); \
  console.log('VAPID_PRIVATE_KEY='+k.privateKey);")
VAPID_PUB=$(echo "$VAPID_OUT" | grep VAPID_PUBLIC_KEY | cut -d= -f2)
VAPID_PRIV=$(echo "$VAPID_OUT" | grep VAPID_PRIVATE_KEY | cut -d= -f2)

docker run --rm --network "$NETWORK" \
  -v "$REPO_ROOT:/w" -w /w \
  -e DATABASE_URL="postgresql://postgres:postgres@${PG_HOST}:5432/daydesk_test" \
  -e DIRECT_URL="postgresql://postgres:postgres@${PG_HOST}:5432/daydesk_test" \
  -e NEXTAUTH_SECRET='e2e-fixed-secret-do-not-use-in-production-32chars' \
  -e NEXTAUTH_URL='http://localhost:3100' \
  -e OAUTH_ISSUER='http://localhost/oidc' \
  -e OAUTH_CLIENT_ID='test' \
  -e OAUTH_CLIENT_SECRET='test' \
  -e OAUTH_LOGOUT_URL='http://localhost/logout' \
  -e VAPID_SUBJECT='mailto:e2e@example.test' \
  -e PUSH_API_SECRET='e2e' \
  -e NEXT_PUBLIC_DISABLE_SW='1' \
  -e PLAYWRIGHT_USE_BUILD='1' \
  -e VAPID_PUBLIC_KEY="$VAPID_PUB" \
  -e VAPID_PRIVATE_KEY="$VAPID_PRIV" \
  "$IMAGE" \
  bash -lc "npm ci --no-audit --no-fund && npx prisma generate && npx playwright test --grep visual"
