#!/usr/bin/env bash
# generate-api-client.sh
# Generates typed React Query hooks from the API OpenAPI spec using orval.
# Flow: start API in background -> wait for /api/docs-json -> run orval -> kill API -> format

set -euo pipefail

API_PORT="${PORT:-3000}"
SPEC_URL="http://localhost:${API_PORT}/api/docs-json"
MAX_WAIT_SECS=60
POLL_INTERVAL=2

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

ENV_FILE=".env"
[[ -f ".env.worktree" ]] && ENV_FILE=".env.worktree"
if [[ -f "$ENV_FILE" ]]; then
  set -o allexport; source "$ENV_FILE"; set +o allexport
fi

PROJECT_NAME="$(node -e "process.stdout.write(require('./package.json').name)")"

echo "Starting API on port $API_PORT..."
pnpm --filter "@${PROJECT_NAME}/api" run start:dev > /tmp/api-gen-log.txt 2>&1 &
API_PID=$!
trap 'echo "Shutting down API (PID $API_PID)"; kill "$API_PID" 2>/dev/null || true; wait "$API_PID" 2>/dev/null || true' EXIT

echo "Waiting for OpenAPI spec at $SPEC_URL..."
ELAPSED=0
until curl -sf "$SPEC_URL" > /dev/null 2>&1; do
  if [[ $ELAPSED -ge $MAX_WAIT_SECS ]]; then
    echo "API did not expose spec within ${MAX_WAIT_SECS}s. Check /tmp/api-gen-log.txt" >&2
    exit 1
  fi
  echo -n "."; sleep "$POLL_INTERVAL"; ELAPSED=$((ELAPSED + POLL_INTERVAL))
done
echo ""
echo "Spec available"

SPEC_FILE="/tmp/openapi-spec.json"
curl -sf "$SPEC_URL" -o "$SPEC_FILE"
echo "Spec downloaded to $SPEC_FILE"

ORVAL_CONFIG="$REPO_ROOT/apps/web/orval.config.ts"
if [[ ! -f "$ORVAL_CONFIG" ]]; then
  echo "orval.config.ts not found at $ORVAL_CONFIG" >&2; exit 1
fi

echo "Running orval..."
pnpm --filter "@${PROJECT_NAME}/web" orval --config "$ORVAL_CONFIG"
echo "orval generation complete"

echo "Formatting generated files..."
pnpm prettier --write "apps/web/src/lib/api/**/*.ts" 2>/dev/null ||   pnpm prettier --write "apps/web/src/lib/api-generated.ts" 2>/dev/null ||   echo "Warning: could not locate generated files to format"

echo "API client generation complete."
