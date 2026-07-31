#!/usr/bin/env bash
# Run the visual regression suite inside the Playwright Docker image to
# compare against committed baselines. Same infra as
# generate-visual-baselines.sh but *without* --update-snapshots.
#
# Prereq: the compose e2e Postgres is up:
#   docker compose --profile e2e up -d postgres-e2e
#
# Usage:  ./e2e/scripts/verify-visual-baselines.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE="mcr.microsoft.com/playwright:v1.62.0-noble"
NETWORK="daydesk_default"
PG_HOST="daydesk-postgres-e2e-1"
PG_PORT="5432"

VAPID_OUT=$(node -e "const k=require('web-push').generateVAPIDKeys(); \
  console.log('VAPID_PUBLIC_KEY='+k.publicKey); \
  console.log('VAPID_PRIVATE_KEY='+k.privateKey);")
VAPID_PUB=$(echo "$VAPID_OUT" | grep VAPID_PUBLIC_KEY | cut -d= -f2)
VAPID_PRIV=$(echo "$VAPID_OUT" | grep VAPID_PRIVATE_KEY | cut -d= -f2)

docker run --rm --network "$NETWORK" \
  -v "$REPO_ROOT:/w" -w /w \
  -e DATABASE_URL="postgresql://postgres:postgres@${PG_HOST}:${PG_PORT}/daydesk_test" \
  -e DIRECT_URL="postgresql://postgres:postgres@${PG_HOST}:${PG_PORT}/daydesk_test" \
  -e NEXTAUTH_SECRET='e2e-fixed-secret-do-not-use-in-production-32chars' \
  -e NEXTAUTH_URL='http://localhost:3100' \
  -e OAUTH_ISSUER='http://localhost/oidc' \
  -e OAUTH_CLIENT_ID='test' \
  -e OAUTH_CLIENT_SECRET='test' \
  -e VAPID_SUBJECT='mailto:e2e@example.test' \
  -e PUSH_API_SECRET='e2e' \
  -e NEXT_PUBLIC_DISABLE_SW='1' \
  -e NEXT_PUBLIC_SKELETON_MIN_MS='0' \
  -e PLAYWRIGHT_USE_BUILD='1' \
  -e VAPID_PUBLIC_KEY="$VAPID_PUB" \
  -e VAPID_PRIVATE_KEY="$VAPID_PRIV" \
  "$IMAGE" \
  bash -lc "npm ci --no-audit --no-fund && npx prisma generate && npx playwright test --grep visual"
