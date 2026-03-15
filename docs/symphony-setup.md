# Symphony Setup

Symphony is the orchestration layer that coordinates coding agents working in worktrees. It connects Linear (task management), git worktrees (isolated environments), and coding agents (Codex, Claude Code) into an autonomous development pipeline.

This document covers how to configure Symphony for a project scaffolded from Symphony Forge.

---

## Prerequisites

- A project scaffolded from Symphony Forge (running, tested, green CI)
- A Linear workspace with API access
- A GitHub repo with Actions enabled
- An Elixir runtime (for the reference Symphony implementation) **or** a custom webhook server

---

## Step 1: Configure Linear

Symphony tracks work through Linear issues. Each issue becomes a worktree, a coding agent session, and eventually a PR.

### Create a Linear Project

1. In Linear, create a new project for your app (e.g. "my-app")
2. Set up the standard workflow states:
   - `Backlog` → `In Progress` → `In Review` → `Done`
3. Note your **Linear API key** and **Team ID** (Settings → API)

### Set Up WORKFLOW.md

Create a `WORKFLOW.md` in your project root. This file tells Symphony how to handle each state transition:

```markdown
# WORKFLOW.md — Symphony Configuration

## Linear Team
TEAM_ID=your-team-id
PROJECT_ID=your-project-id

## Branch Naming
Branch names are derived from Linear issue IDs: feat/ENG-123-short-description

## Agent Assignment
- Issues labelled `agent:codex` → Codex agent
- Issues labelled `agent:claude` → Claude Code agent
- Issues labelled `agent:human` → Skipped (human will handle)

## Validation
On every push: pnpm check:all && pnpm turbo run typecheck && pnpm turbo run test

## Merge Strategy
Squash merge to main. PR title = Linear issue title.

## Notifications
On failure: post comment to Linear issue with linter output
On success: transition Linear issue to "In Review"
On merge: transition Linear issue to "Done"
```

---

## Step 2: Deploy Symphony

### Option A: Elixir Reference Implementation

```bash
# Clone the Symphony runtime
git clone https://github.com/your-org/symphony
cd symphony

# Configure
cp config/runtime.exs.example config/runtime.exs
# Edit config/runtime.exs with your Linear API key and GitHub token

# Start
mix deps.get
mix phx.server
```

Symphony exposes a webhook endpoint at `https://your-symphony-host/webhooks/github`.

### Option B: Custom Webhook Server

If you're using a different runtime, Symphony's contract is simple:

**Incoming webhook (GitHub push):**
```json
{
  "ref": "refs/heads/feat/ENG-123-add-billing",
  "repository": { "full_name": "your-org/my-app" },
  "commits": [...]
}
```

**Symphony actions:**
1. Parse branch name → extract Linear issue ID (`ENG-123`)
2. Run validation loop in the worktree (`pnpm check:all && pnpm test`)
3. On failure: post error to Linear issue comment
4. On success: create/update PR, transition Linear issue state

---

## Step 3: Configure GitHub Webhooks

In your GitHub repo → Settings → Webhooks:

1. **Payload URL:** `https://your-symphony-host/webhooks/github`
2. **Content type:** `application/json`
3. **Secret:** (generate with `openssl rand -hex 32`)
4. **Events:** Select `Push`, `Pull request`, `Pull request review`

---

## Step 4: Configure Workspace Hooks

Workspace hooks let Symphony trigger agent actions on specific git events in worktrees.

Create `.git/hooks/post-commit` in your repo (or configure via `husky`):

```bash
#!/usr/bin/env bash
# Notify Symphony after each commit in a worktree
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" =~ ^feat/|^fix/|^chore/ ]]; then
  curl -s -X POST "https://your-symphony-host/hooks/commit" \
    -H "Content-Type: application/json" \
    -d "{\"branch\": \"$BRANCH\", \"commit\": \"$(git rev-parse HEAD)\"}" \
    > /dev/null
fi
```

---

## Step 5: Monitoring

### Symphony Dashboard

The reference Symphony implementation includes a LiveView dashboard at `https://your-symphony-host/dashboard`.

Displays:
- Active worktrees and their current validation phase
- Recent agent activity (commits, linter results, test outcomes)
- Linear issue states
- Queue depth (issues waiting for an agent)

### Metrics to Watch

| Metric | Healthy | Concerning |
|--------|---------|-----------|
| Validation loop pass rate | > 85% | < 70% |
| Average cycles per issue | < 5 | > 10 |
| Worktree boot time | < 60s | > 3 min |
| Agent context exhaustion rate | < 10% | > 25% |

**High cycle count** (an agent needing > 10 validation loop iterations to complete an issue) indicates the issue is too large, the AGENTS.md is insufficiently clear, or the linter error messages need improvement.

---

## Step 6: Agent Configuration

### Codex

Add a `codex.md` to your project root with agent-specific instructions:

```markdown
# codex.md

You are working on {{PROJECT_NAME}}.

## Boot
Run `./scripts/boot.sh` before making any changes.

## After each change
Run `pnpm check:all` to check for structural violations.
Violations include remediation steps — follow them exactly.

## Commit style
feat(scope): description
fix(scope): description

## Never
- Hardcode ports, URLs, or credentials
- Import across domain boundaries
- Modify existing Prisma migrations
- Skip structural checks
```

### Claude Code

Claude Code reads `AGENTS.md` automatically. Ensure it's up to date before assigning issues.

---

## Troubleshooting

**Symphony can't reach the worktree:**
The worktree must be on a machine Symphony can SSH into, or Symphony must run on the same machine as the worktrees.

**Validation loop never finishes:**
Check for infinite loops in tests, or a test that waits indefinitely for an external service. Set `testTimeout: 10000` in vitest config.

**Agent keeps violating the same boundary:**
The error message isn't clear enough. Update `linters/check-boundaries.ts` to produce a more specific remediation message for that violation pattern.

**Linear issue stuck in "In Progress":**
The agent may have exhausted its context. Symphony should detect this via a timeout (configurable: `AGENT_TIMEOUT_MINUTES`, default 30) and post a human escalation comment.
