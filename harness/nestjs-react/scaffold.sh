#!/usr/bin/env bash
set -euo pipefail

# Symphony Forge — NestJS/React Harness Scaffold
# Usage: ./scaffold.sh <project-name> <output-dir> [--port-base 3000] [--db-port 5432] [--redis-port 6379]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/template"

# ── Argument Parsing ──────────────────────────────────────────────────────────

PROJECT_NAME=""
OUTPUT_DIR=""
PORT_BASE=3000
DB_PORT=5432
REDIS_PORT=6379

usage() {
  echo "Usage: $0 <project-name> <output-dir> [--port-base 3000] [--db-port 5432] [--redis-port 6379]"
  echo ""
  echo "Arguments:"
  echo "  project-name    Slug for the project (e.g. acme-portal)"
  echo "  output-dir      Where to create the project"
  echo ""
  echo "Options:"
  echo "  --port-base     API port base (web = base+1) — default 3000"
  echo "  --db-port       Postgres port — default 5432"
  echo "  --redis-port    Redis port — default 6379"
  exit 1
}

if [[ $# -lt 2 ]]; then
  usage
fi

PROJECT_NAME="$1"
OUTPUT_DIR="$2"
shift 2

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port-base) PORT_BASE="$2"; shift 2 ;;
    --db-port) DB_PORT="$2"; shift 2 ;;
    --redis-port) REDIS_PORT="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

WEB_PORT=$((PORT_BASE + 1))

# ── Validation ────────────────────────────────────────────────────────────────

if [[ ! "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]+$ ]]; then
  echo "Error: project-name must be lowercase alphanumeric with hyphens (e.g. acme-portal)"
  exit 1
fi

if [[ -d "$OUTPUT_DIR" ]]; then
  echo "Error: $OUTPUT_DIR already exists. Choose a different output directory."
  exit 1
fi

# Convert project name to PascalCase for class names
PROJECT_PASCAL=$(echo "$PROJECT_NAME" | sed 's/-\([a-z]\)/\U\1/g; s/^\([a-z]\)/\U\1/')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Symphony Forge — Scaffold"
echo "  Project:    $PROJECT_NAME"
echo "  Output:     $OUTPUT_DIR"
echo "  API Port:   $PORT_BASE"
echo "  Web Port:   $WEB_PORT"
echo "  DB Port:    $DB_PORT"
echo "  Redis Port: $REDIS_PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Copy Template ─────────────────────────────────────────────────────────────

echo ""
echo "▶ Copying template..."
cp -r "$TEMPLATE_DIR" "$OUTPUT_DIR"

# Copy .gitignore (cp doesn't always copy dotfiles)
if [[ -f "$TEMPLATE_DIR/.gitignore" ]]; then
  cp "$TEMPLATE_DIR/.gitignore" "$OUTPUT_DIR/.gitignore"
fi
if [[ -f "$TEMPLATE_DIR/.env.example" ]]; then
  cp "$TEMPLATE_DIR/.env.example" "$OUTPUT_DIR/.env.example"
fi
if [[ -f "$TEMPLATE_DIR/.eslintrc.cjs" ]]; then
  cp "$TEMPLATE_DIR/.eslintrc.cjs" "$OUTPUT_DIR/.eslintrc.cjs"
fi
if [[ -f "$TEMPLATE_DIR/.prettierrc" ]]; then
  cp "$TEMPLATE_DIR/.prettierrc" "$OUTPUT_DIR/.prettierrc"
fi

# ── Token Replacement ─────────────────────────────────────────────────────────

echo "▶ Replacing tokens..."

# Replace all occurrences of template placeholders
find "$OUTPUT_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.md" -o -name "*.sh" -o -name "*.cjs" -o -name "*.js" -o -name "*.html" -o -name "*.prisma" -o -name ".env.example" -o -name ".gitignore" \) | while read -r file; do
  sed -i.bak \
    -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
    -e "s/{{PROJECT_PASCAL}}/$PROJECT_PASCAL/g" \
    -e "s/{{PORT_BASE}}/$PORT_BASE/g" \
    -e "s/{{WEB_PORT}}/$WEB_PORT/g" \
    -e "s/{{DB_PORT}}/$DB_PORT/g" \
    -e "s/{{REDIS_PORT}}/$REDIS_PORT/g" \
    "$file"
  rm -f "${file}.bak"
done

# ── .env Setup ────────────────────────────────────────────────────────────────

echo "▶ Creating .env from .env.example..."
cp "$OUTPUT_DIR/.env.example" "$OUTPUT_DIR/.env"

# ── Worktrees Directory ───────────────────────────────────────────────────────

echo "▶ Creating worktrees staging directory..."
mkdir -p "$(dirname "$OUTPUT_DIR")/${PROJECT_NAME}-worktrees"

# ── Git Init ─────────────────────────────────────────────────────────────────

echo "▶ Initializing git repository..."
cd "$OUTPUT_DIR"
git init
git add -A
git commit -m "chore: scaffold $PROJECT_NAME from symphony-forge template"

# ── pnpm Install ─────────────────────────────────────────────────────────────

echo "▶ Installing dependencies (pnpm install)..."
if command -v pnpm &>/dev/null; then
  pnpm install
else
  echo "  ⚠ pnpm not found — skipping install. Run 'pnpm install' manually."
fi

# ── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Scaffold complete!"
echo ""
echo "  Next steps:"
echo "  1. cd $OUTPUT_DIR"
echo "  2. Edit .env (add AWS Cognito credentials, etc.)"
echo "  3. ./scripts/boot.sh"
echo "  4. Open http://localhost:$WEB_PORT"
echo ""
echo "  For agent worktrees:"
echo "  ./scripts/setup-worktree.sh feature/my-feature 1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
