---
# Symphony Workflow Configuration
# https://platform.openai.com/docs/symphony

version: "1"

tracker:
  provider: linear
  workspace: "{{PROJECT_NAME}}"
  api_key: "${LINEAR_API_KEY}"
  team_id: "${LINEAR_TEAM_ID}"
  # Filter: only issues in the 'In Progress' state assigned to the 'symphony' agent label
  filter:
    state: "In Progress"
    labels:
      - symphony

polling:
  interval_seconds: 60
  # Stop polling if no new issues for 4 hours
  idle_timeout_seconds: 14400

workspace:
  # Worktrees root relative to this repo
  worktrees_dir: "../{{PROJECT_NAME}}-worktrees"
  
  hooks:
    after_create: |
      # Called after a new worktree is created for a task
      cd "${WORKTREE_PATH}"
      ./scripts/boot.sh
      echo "Worktree ready at ${WORKTREE_PATH}"

    before_run: |
      # Called before starting the agent on an issue
      cd "${WORKTREE_PATH}"
      git pull origin main --rebase || true
      pnpm install --frozen-lockfile
      pnpm --filter api prisma migrate deploy

    after_run: |
      # Called after agent completes (success or failure)
      cd "${WORKTREE_PATH}"
      # Push branch
      git push origin HEAD --force-with-lease || true

agent:
  # Max parallel worktrees (limited by DB port range)
  concurrency: 5
  # Retry failed tasks once
  max_retries: 1
  retry_delay_seconds: 30

codex:
  # Approval policy for file operations
  approval_policy: auto-edit
  # Never approve shell commands that aren't in the allowlist
  shell_approval_policy: allowlist
  shell_allowlist:
    - "pnpm"
    - "npx"
    - "git"
    - "docker"
    - "prisma"
  # Max time per task
  timeout_seconds: 7200
  # Model
  model: "o4-mini"
  reasoning_effort: "high"

# ── Prompt Template ───────────────────────────────────────────────────────────
# Liquid template — {{ variable }} syntax
# Available variables: issue, worktree, project

prompt: |
  You are a software engineer working on {{PROJECT_NAME}}.
  
  ## Your Environment
  
  You are in a git worktree at `{{ worktree.path }}`.
  Your environment is already booted:
  - API: http://localhost:{{ worktree.api_port }}
  - Web: http://localhost:{{ worktree.web_port }}
  - Database: postgresql://postgres:postgres@localhost:{{ worktree.db_port }}/{{PROJECT_NAME}}
  
  Read `AGENTS.md` before writing any code. It contains the architecture rules and common task guides.
  
  ## Your Task
  
  **Issue:** {{ issue.title }} (#{{ issue.number }})
  **URL:** {{ issue.url }}
  
  {{ issue.description }}
  
  ## Acceptance Criteria
  
  {% for criterion in issue.acceptance_criteria %}
  - {{ criterion }}
  {% endfor %}
  
  ## Rules
  
  1. Read `docs/architecture.md` before creating new files. Follow the layer rules.
  2. Run `pnpm check:all` before finishing. Fix any violations.
  3. Write tests for business logic. Aim for >80% coverage on services.
  4. Update `docs/domain-model.md` if you add new entities.
  5. Update `AGENTS.md` if you add new modules or key files.
  6. Commit with conventional commit format: `feat(domain): description`
  
  ## Definition of Done
  
  - [ ] All acceptance criteria met
  - [ ] `pnpm test` passes
  - [ ] `pnpm check:all` passes (no structural violations)
  - [ ] `pnpm typecheck` passes
  - [ ] Code reviewed by running `pnpm lint`
  - [ ] PR description explains what changed and why
---

# {{PROJECT_NAME}} Workflow

This file configures Symphony for parallel agent development on this project.

## How It Works

1. Issues labeled `symphony` in Linear are picked up automatically
2. Each issue gets a new git worktree with isolated DB and app ports
3. A Codex agent boots the environment and works the issue
4. Agent pushes a branch, Symphony creates a PR
5. You review and merge

## Issue Requirements

For Symphony to work well, issues must have:
- Clear acceptance criteria (3-5 specific checks)
- Single domain scope (one module)
- Explicit input/output description

See `skill/SKILL.md` for issue decomposition guidance.

## Port Allocation

Worktrees are assigned ports based on their offset (1-5):

| Offset | API Port | Web Port | DB Port | Redis Port |
|--------|----------|----------|---------|------------|
| 0 (main) | {{PORT_BASE}} | {{WEB_PORT}} | {{DB_PORT}} | {{REDIS_PORT}} |
| 1 | {{PORT_BASE}}1 | {{WEB_PORT}}1 | {{DB_PORT}}1 | {{REDIS_PORT}}1 |
| 2 | {{PORT_BASE}}2 | {{WEB_PORT}}2 | {{DB_PORT}}2 | {{REDIS_PORT}}2 |
| 3 | {{PORT_BASE}}3 | {{WEB_PORT}}3 | {{DB_PORT}}3 | {{REDIS_PORT}}3 |
| 4 | {{PORT_BASE}}4 | {{WEB_PORT}}4 | {{DB_PORT}}4 | {{REDIS_PORT}}4 |
| 5 | {{PORT_BASE}}5 | {{WEB_PORT}}5 | {{DB_PORT}}5 | {{REDIS_PORT}}5 |

## Environment Variables Required

```
LINEAR_API_KEY=lin_api_xxxx
LINEAR_TEAM_ID=xxxx
```

Set these in the Symphony dashboard or in a `.symphony.env` file (gitignored).
