# AGENTS.md — {{PROJECT_NAME}} Codebase Map

This file is the table of contents for coding agents. Read it first. It tells you where everything is, what the rules are, and how to boot the environment.

## Environment Setup

Before writing any code, your environment must be booted:

```bash
# If you're in a worktree (most common for Symphony agents):
cat .env.worktree  # Check your port assignments
docker compose -f docker-compose.yml -f docker-compose.worktree.yml up -d
pnpm install
pnpm --filter api prisma migrate deploy
pnpm --filter api prisma db seed
```

Your API runs on `$PORT`, your web on `$WEB_PORT`, your DB on `$DB_PORT`.

## Repository Layout

```
.
├── apps/
│   ├── api/           NestJS backend (port $PORT)
│   └── web/           React frontend (port $WEB_PORT)
├── packages/
│   └── shared/        Types and validation shared across apps
├── scripts/           Worktree + boot scripts
├── linters/           Structural integrity checks
└── docs/              Architecture, domain model, API patterns
```

## Architecture Rules (Read Before Writing Code)

**Layer dependency direction: Types → Config → Repo → Service → Runtime → UI**

- Types and shared interfaces live in `packages/shared/`
- Config (env parsing, constants) depends only on types
- Repositories depend on config + types
- Services depend on repos + config + types
- Controllers/resolvers depend on services
- The web app (UI) depends on the API via the typed client

**Violation = broken build.** The structural linter `linters/check-imports.ts` will catch it.

**Domain boundaries:**
- Modules don't import from sibling modules directly
- Cross-domain types go through `packages/shared/`
- The `auth` module is special — it's imported by everyone via guards

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | Database schema — source of truth |
| `apps/api/src/app.module.ts` | NestJS root module — all modules registered here |
| `apps/api/src/main.ts` | App bootstrap — port, swagger, validation pipe |
| `apps/web/src/App.tsx` | React root — router setup |
| `apps/web/src/lib/api-client.ts` | Generated typed API client |
| `packages/shared/src/types/index.ts` | Shared TypeScript types |
| `packages/shared/src/validation/index.ts` | Shared Zod schemas |

## Documentation

| Doc | Contents |
|-----|---------|
| `docs/architecture.md` | Layer rules, domain boundaries, dependency direction |
| `docs/domain-model.md` | Entities, relationships, cardinalities |
| `docs/api-patterns.md` | REST conventions, error format, pagination |
| `docs/quality-grades.md` | Grading criteria per domain (A-F) |
| `docs/testing-strategy.md` | Unit, integration, E2E, structural test locations |
| `docs/adr/001-monorepo-structure.md` | Why this stack |

## Common Tasks

### Add a New Domain Module (e.g., "billing")

1. `nest g module billing apps/api/src/billing`
2. `nest g service billing apps/api/src/billing`
3. `nest g controller billing apps/api/src/billing`
4. Add to `app.module.ts` imports
5. Add schema models to `prisma/schema.prisma`, run `pnpm db:migrate`
6. Add types to `packages/shared/src/types/`
7. Run `pnpm generate:api-client` to update the frontend client

### Add a Database Migration

```bash
pnpm --filter api prisma migrate dev --name describe-the-change
```

Never modify existing migrations. Always create new ones.

### Run Structural Checks

```bash
pnpm check:all
```

Errors include remediation instructions. Fix what's flagged before committing.

### Run Tests

```bash
pnpm test              # All unit tests
pnpm --filter api test:e2e  # API integration tests
```

## What NOT To Do

- Don't import across domain modules directly. Use shared package or emit events.
- Don't hardcode ports, credentials, or URLs. Use environment variables.
- Don't modify existing Prisma migrations. Create new ones.
- Don't skip the structural linters. They exist because agents make architectural mistakes.
- Don't commit `.env` files. `.env.example` is the source of truth.
