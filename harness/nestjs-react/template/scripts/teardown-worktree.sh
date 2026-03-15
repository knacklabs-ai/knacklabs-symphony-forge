#!/usr/bin/env bash
# teardown-worktree.sh
# Usage: ./scripts/teardown-worktree.sh <branch-name>
# Stops Docker services, removes the worktree, prunes git refs.

set -euo pipefail

BRANCH="${1:-}"
if [[ -z "$BRANCH" ]]; then
  echo "Usage: $0 <branch-name>" >&2; exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
PROJECT_NAME="$(node -e "process.stdout.write(require('$REPO_ROOT/package.json').name)")"
SAFE_BRANCH="${BRANCH//\//-}"
WORKTREE_DIR="$(dirname "$REPO_ROOT")/${PROJECT_NAME}-${SAFE_BRANCH}"

if [[ ! -d "$WORKTREE_DIR" ]]; then
  echo "Worktree not found: $WORKTREE_DIR" >&2; exit 1
fi

echo "Tearing down worktree: $WORKTREE_DIR"

# Stop Docker services
if [[ -f "$WORKTREE_DIR/docker-compose.worktree.yml" ]]; then
  echo "Stopping Docker services..."
  (cd "$WORKTREE_DIR" && docker compose -f docker-compose.yml -f docker-compose.worktree.yml down --volumes --remove-orphans 2>/dev/null || true)
  echo "Docker services stopped"
else
  echo "No docker-compose overlay found, skipping Docker teardown"
fi

# Remove worktree directory
echo "Removing worktree directory..."
rm -rf "$WORKTREE_DIR"
echo "Directory removed"

# Prune git worktree reference
echo "Pruning git worktree reference..."
git -C "$REPO_ROOT" worktree prune
echo "Git reference pruned"

# Optionally delete branch
read -r -p "Delete branch ''$BRANCH'' too? [y/N] " CONFIRM
if [[ "${CONFIRM,,}" == "y" ]]; then
  git -C "$REPO_ROOT" branch -d "$BRANCH" 2>/dev/null || git -C "$REPO_ROOT" branch -D "$BRANCH" && echo "Branch deleted" || echo "Could not delete branch (may have unmerged commits)"
else
  echo "Branch kept"
fi

echo "Teardown complete for branch: $BRANCH"
