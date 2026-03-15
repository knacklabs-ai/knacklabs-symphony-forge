#!/usr/bin/env bash
# boot.sh

set -euo pipefail

GREEN="[0;32m"; YELLOW="[1;33m"; RED="[0;31m"; NC="[0m"
info()  { echo -e "${GREEN}[boot]${NC} $*"; }
warn()  { echo -e "${YELLOW}[boot]${NC} $*"; }
error() { echo -e "${RED}[boot]${NC} $*" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f ".env.worktree" ]]; then
  info "Worktree detected: loading .env.worktree"
  set -o allexport; source .env.worktree; set +o allexport
  COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.worktree.yml"
elif [[ -f ".env" ]]; then
  info "Loading .env"
  set -o allexport; source .env; set +o allexport
  COMPOSE_CMD="docker compose"
else
  warn "No .env found: copying .env.example"
  cp .env.example .env
  set -o allexport; source .env; set +o allexport
  COMPOSE_CMD="docker compose"
fi

DB_PORT="${DB_PORT:-5432}"
API_PORT="${PORT:-3000}"
WEB_PORT="${WEB_PORT:-5173}"

info "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
  error "Docker is not running. Start Docker Desktop and retry."
fi
info "Docker is running checkmark"

info "Starting Docker services..."
$COMPOSE_CMD up -d --remove-orphans

info "Installing pnpm dependencies..."
pnpm install --frozen-lockfile

info "Waiting for Postgres on port $DB_PORT..."
MAX_RETRIES=30; RETRY_INTERVAL=2; RETRIES=0
until pg_isready -h "${DB_HOST:-localhost}" -p "$DB_PORT" -U "${DB_USER:-postgres}" > /dev/null 2>&1; do
  RETRIES=$((RETRIES + 1))
  if [[ $RETRIES -ge $MAX_RETRIES ]]; then
    error "Postgres not ready after $((MAX_RETRIES * RETRY_INTERVAL))s. Check: docker compose logs postgres"
  fi
  echo -n "."; sleep "$RETRY_INTERVAL"
done
echo ""; info "Postgres ready checkmark"

PROJECT_NAME="$(node -e "process.stdout.write(require('./package.json').name)")"
info "Applying Prisma migrations..."
pnpm --filter "@${PROJECT_NAME}/api" prisma migrate deploy

info "Seeding database..."
pnpm --filter "@${PROJECT_NAME}/api" prisma db seed

echo ""
echo -e "${GREEN}Boot complete!${NC}"
echo -e "  API  ->  http://localhost:$API_PORT"
echo -e "  Web  ->  http://localhost:$WEB_PORT"
echo -e "  DB   ->  localhost:$DB_PORT"
echo -e "  Docs ->  http://localhost:$API_PORT/api/docs"
echo "  pnpm dev  to start the dev servers"
