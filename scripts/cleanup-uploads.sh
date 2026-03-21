#!/bin/bash
# Cleanup expired upload intents
# Can be called manually or via cron:
#   0 * * * * /root/wine-app/scripts/cleanup-uploads.sh >> /var/log/cleanup-uploads.log 2>&1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables if .env exists
if [ -f "$PROJECT_DIR/apps/web/.env.local" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/apps/web/.env.local" | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
CLEANUP_SECRET="${CLEANUP_SECRET:-cleanup-default-secret}"

if [ -z "$SUPABASE_URL" ]; then
  echo "$(date -Iseconds) SKIP: SUPABASE_URL not configured"
  exit 0
fi

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $CLEANUP_SECRET" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/functions/v1/cleanup-uploads")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "$(date -Iseconds) HTTP=$HTTP_CODE $BODY"
