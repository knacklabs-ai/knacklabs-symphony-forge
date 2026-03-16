# AGENTS.md — Symphony-Forge

## Workspace: /private/tmp/symphony-forge

## What This Is

Plan-driven engineering platform for KnackLabs. Engineers write plans, agents build production code.

## Current Task

Build the v1 platform: Projects + Documents with Azure AD auth and Proof SDK integration.
**Read `projects/knack-forge/PLAN.md` before writing any code.** That is the source of truth.

## Stack (LOCKED)

- **API:** NestJS + Prisma + PostgreSQL
- **Web:** React + Vite + Tailwind + TanStack Query + Zustand
- **Editor:** Proof SDK (collaborative markdown — install as npm dependency, DO NOT fork)
- **Auth:** Azure AD / Entra ID OIDC
- **Build:** pnpm + Turborepo
- **Testing:** Vitest (API + Web), 100% line coverage

## Repo Structure

```
symphony-forge/
├── apps/
│   ├── web/                    # React + Vite + Tailwind
│   └── api/                    # NestJS backend
├── packages/
│   └── shared/                 # Types, DTOs, constants
├── harness/
│   └── nestjs-react/
│       ├── SCAFFOLD_PROMPT.md
│       └── conventions/*.md    # ← YOUR RULEBOOK
├── projects/
│   └── knack-forge/PLAN.md
└── AGENTS.md                   # ← YOU ARE HERE
```

## Convention System (MANDATORY)

All conventions live in `harness/nestjs-react/conventions/*.md`.

### Before Writing ANY Module

Read these conventions and follow them literally:

| When building... | Read these conventions |
|---|---|
| Any backend module | `code-quality.md`, `api-patterns.md`, `architecture.md` |
| Database/Prisma | `database.md` |
| Auth/guards | `security.md` |
| Tests | `testing.md` (factories, mocking, integration harness) |
| Logging | `logging.md` (pino, correlation IDs, PII masking) |
| Frontend components | `frontend-patterns.md`, `code-quality.md` |
| Workers/queues | `workers.md` |
| Git commits | `git.md` |
| CI pipeline | `ci-pipeline.md` |

### Per-Module Compliance Checklist

After writing each module (e.g. `projects/`), verify:

- [ ] All source files ≤200 lines (target 150). If >150, split per `code-quality.md` guidance.
- [ ] All files use approved suffixes (18 listed in `code-quality.md`).
- [ ] Zero `any`, `console.log`, `@ts-ignore`, magic numbers, commented-out code.
- [ ] Every error thrown is `AppException` with category/code/description/retryable.
- [ ] Constructor injections ≤5 per class.
- [ ] Unit tests exist: `*.spec.ts` co-located, 100% line coverage for services/guards/pipes/utils.
- [ ] Factories in `apps/api/test/factories/` using faker.
- [ ] Structured logging with `nestjs-pino` + correlation IDs (not console, not NestJS Logger).
- [ ] DTOs for all inputs AND outputs. No raw Prisma objects in responses.

### When Conventions Conflict With PLAN.md

- PLAN.md wins for project-specific decisions (auth provider, domain model, features).
- Convention wins for code patterns (file size, testing, logging, error handling).
- If genuinely ambiguous: add `// CONVENTION_CONFLICT: <convention> says X, PLAN says Y, chose Y because Z`

## Hard Rules

1. **100% line coverage.** No exceptions. Convention `testing.md` has patterns.
2. **200-line max per source file** (excl. tests, .sql, .json, .prisma, .md, generated).
3. **Split at 150 lines** — see `code-quality.md` for how.
4. **Structured logging** — `nestjs-pino` with correlation IDs. See `logging.md`.
5. **Structured errors** — `AppException` only. See `code-quality.md`.
6. **Zero tolerance:** `any`, `console.log` in prod, `@ts-ignore` without issue, magic numbers, commented-out code.
7. **Proof SDK is a dependency.** Do NOT modify its source. Use its HTTP API.
8. **Proof ownerSecret encrypted at rest** in PostgreSQL.

## Build Order

Follow PLAN.md phases. For each phase:
1. Read relevant conventions
2. Build the module
3. Write tests (100% coverage)
4. Run compliance checklist above
5. Fix violations before moving to next module

## When You're Stuck

- Re-read the relevant convention file
- If convention doesn't cover it, make the pragmatic choice and document WHY with a code comment
- Prefer boring, correct code over clever code
