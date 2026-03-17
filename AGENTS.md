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
│       ├── src/                # Source modules
│       └── test/
│           ├── factories/      # Faker-based test factories
│           └── support/        # Test harness, auth helpers
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

---

## ⛔ THE ONE RULE THAT GATES EVERYTHING

**You MUST NOT move to the next module until the current module has 100% test coverage.**

This is not a suggestion. This is a hard gate. The build order below enforces it.

### What "Done" Means For a Module

A module is NOT done until ALL of these exist:

1. ✅ Source files (service, controller, repository, DTOs, errors, mappers)
2. ✅ **Unit test for every service** — `*.service.spec.ts` co-located, 100% line coverage
3. ✅ **Unit test for every guard** — `*.guard.spec.ts`, allow + deny cases
4. ✅ **Unit test for every pipe/interceptor** — `*.pipe.spec.ts` / `*.interceptor.spec.ts`
5. ✅ **Factory for every entity** — `apps/api/test/factories/*.factory.ts` using `@faker-js/faker`
6. ✅ All files ≤200 lines (target 150)
7. ✅ Zero `any`, `console.log`, `@ts-ignore`, magic numbers, commented-out code
8. ✅ Every error is `AppException` with category/code/description/retryable
9. ✅ Structured logging with `nestjs-pino` + correlation IDs

**If you write a service without its spec file, you are not done. Go back and write the tests.**

---

## Build Order (STRICT — follow this sequence)

### Phase 1: Foundation
1. **Prisma schema + migrations** — Read `database.md`
2. **Test factories** — Create `apps/api/test/factories/` with faker factories for EVERY entity in the schema
3. **Test harness** — Create `apps/api/test/support/test-harness.ts` and `auth.helper.ts` per `testing.md`
4. **Common modules** — AppException, correlation middleware, response interceptor, exception filter
   - Write `common/errors/app-exception.ts`
   - Write `common/filters/app-exception.filter.spec.ts` — test the filter
   - Write `common/interceptors/response.interceptor.spec.ts` — test the interceptor
   - Write `common/correlation/correlation.middleware.spec.ts` — test the middleware

### Phase 2: Auth Module
1. Write auth service, controller, guards, repository
2. **IMMEDIATELY write tests:**
   - `auth.service.spec.ts` — mock repository, test login/validate/refresh
   - `jwt-auth.guard.spec.ts` — test allow + deny
   - `roles.guard.spec.ts` — test each role
3. Verify: every service method has a test. Every error branch has a test.
4. **STOP. Do not start Phase 3 until auth tests exist.**

### Phase 3: Projects Module
1. Write projects service, controller, repository, DTOs, errors, mappers
2. Write project-members service + controller
3. Write project-access service
4. **IMMEDIATELY write tests:**
   - `projects.service.spec.ts` — CRUD + slug generation + error paths
   - `project-members.service.spec.ts` — add/remove/update + permissions
   - `project-access.service.spec.ts` — ownership checks
5. **STOP. Do not start Phase 4 until project tests exist.**

### Phase 4: Documents Module
1. Write documents service, controller, repository, DTOs, errors, mappers
2. **IMMEDIATELY write tests:**
   - `documents.service.spec.ts` — CRUD + version management + error paths
3. **STOP. Do not start Phase 5 until document tests exist.**

### Phase 5: Agent Keys Module
1. Write agent-keys service, controller, repository, DTOs, errors
2. **IMMEDIATELY write tests:**
   - `agent-keys.service.spec.ts` — CRUD + hashing + error paths
   - `encryption.service.spec.ts` — encrypt/decrypt roundtrip
3. **STOP. Do not start Phase 6 until agent-key tests exist.**

### Phase 6: Proof Proxy Module
1. Write proof-proxy service
2. **IMMEDIATELY write tests:**
   - `proof-proxy.service.spec.ts` — proxy routing + error handling

### Phase 7: Integration Tests
1. Write `apps/api/test/*.int-spec.ts` for each module
2. Use real DB (transaction rollback per test)
3. Use mock JWT injection (see `testing.md`)

### Phase 8: Frontend
1. Read `frontend-patterns.md`
2. Build pages + components
3. Write component tests

---

## Test Writing Rules (from `testing.md` — READ IT)

### Unit Test Pattern
```typescript
// projects/projects.service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectsService } from './projects.service';
import { buildProject } from '../../test/factories/project.factory';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repo: { findById: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = { findById: vi.fn(), create: vi.fn() };
    service = new ProjectsService(repo as any);
  });

  it('returns project by id', async () => {
    const project = buildProject();
    repo.findById.mockResolvedValue(project);
    expect(await service.getById(project.id)).toEqual(project);
  });

  it('throws NOT_FOUND when project missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getById('x')).rejects.toThrow();
  });
});
```

### Factory Pattern
```typescript
// apps/api/test/factories/project.factory.ts
import { faker } from '@faker-js/faker';

export function buildProject(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    ownerId: faker.string.uuid(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}
```

### Mock Strategy
Mock the layer directly below. **Never mock two layers deep.**

| Class Under Test | Mock This |
|-----------------|-----------|
| Service | Repository |
| Guard | Reflector, ExecutionContext |
| Pipe | — (pure transform) |
| Interceptor | ExecutionContext, CallHandler |

---

## Per-Module Compliance Checklist

After writing each module, verify ALL of these:

- [ ] All source files ≤200 lines (target 150)
- [ ] All files use approved suffixes from `code-quality.md`
- [ ] Zero `any`, `console.log`, `@ts-ignore`, magic numbers, commented-out code
- [ ] Every error is `AppException` with category/code/description/retryable
- [ ] Constructor injections ≤5 per class
- [ ] **Every service has a co-located `*.spec.ts` file**
- [ ] **Every guard has a co-located `*.spec.ts` file**
- [ ] **Every pipe/interceptor has a co-located `*.spec.ts` file**
- [ ] **Factories exist in `apps/api/test/factories/` for every entity**
- [ ] Structured logging with `nestjs-pino` + correlation IDs
- [ ] DTOs for all inputs AND outputs. No raw Prisma in responses.

---

## Hard Rules

1. **TESTS ARE NOT OPTIONAL.** Every service, guard, pipe, interceptor gets a spec file. No exceptions.
2. **100% line coverage.** The coverage report IS the todo list.
3. **Write tests IMMEDIATELY after writing the source file.** Not "later." Not "at the end." NOW.
4. **200-line max per source file** (excl. tests, .sql, .json, .prisma, .md, generated).
5. **Split at 150 lines** — see `code-quality.md` for how.
6. **Structured logging** — `nestjs-pino` with correlation IDs. See `logging.md`.
7. **Structured errors** — `AppException` only. See `code-quality.md`.
8. **Zero tolerance:** `any`, `console.log`, `@ts-ignore` without issue, magic numbers, commented-out code.
9. **Proof SDK is a dependency.** Do NOT modify its source. Use its HTTP API.
10. **Proof ownerSecret encrypted at rest** in PostgreSQL.

### When Conventions Conflict With PLAN.md

- PLAN.md wins for project-specific decisions (auth provider, domain model, features).
- Convention wins for code patterns (file size, testing, logging, error handling).
- If genuinely ambiguous: add `// CONVENTION_CONFLICT: <convention> says X, PLAN says Y, chose Y because Z`

## When You're Stuck

- Re-read the relevant convention file
- If convention doesn't cover it, make the pragmatic choice and document WHY
- Prefer boring, correct code over clever code
