# ADR 001: Monorepo with pnpm Workspaces + Turborepo

**Status:** Accepted  
**Date:** 2024-01-15  
**Deciders:** Engineering team

---

## Context

We needed a repository structure that:
1. Enables multiple AI agents to work in parallel without colliding
2. Supports a full-stack app (backend + frontend) with shared code
3. Can boot to a runnable state in under 2 minutes
4. Has clear architectural boundaries that can be enforced automatically

---

## Decision

**Monorepo with pnpm workspaces and Turborepo.**

- `apps/api` — NestJS backend
- `apps/web` — React + Vite frontend
- `packages/shared` — Shared TypeScript types and validation schemas

---

## Rationale

### Why Monorepo?

Shared TypeScript types between frontend and backend are the core reason. Without a monorepo, you're maintaining types in two places or publishing packages to npm. Neither is acceptable in a fast-moving project.

The secondary reason is agent isolation. With a monorepo, agents can work in git worktrees. Each worktree is a full copy of the repo with its own branch, own docker containers (different ports), and own database. Agents don't conflict even when running simultaneously on the same codebase.

### Why pnpm?

- Faster installs than npm (content-addressable cache)
- Strict package resolution (no phantom dependencies)
- Native workspace support
- Significantly better disk usage in worktree scenarios

### Why Turborepo?

- Intelligent caching of build artifacts
- Parallel task execution across packages
- Understands the dependency graph (`packages/shared` must build before `apps/api`)
- Incremental builds — agents only rebuild what changed

### Why NestJS (not Express, Fastify, Hono)?

NestJS is the only backend framework that:
- Has a module system that enforces boundaries at the framework level
- Generates OpenAPI specs from decorators (required for orval)
- Has first-class TypeScript with full DI container
- Produces consistent code structure that agents understand

The module system is critical. When an agent writes a `billing.module.ts`, the structure is predictable. When it needs auth, it imports `AuthModule`. The patterns are uniform and the framework enforces them.

### Why Prisma (not TypeORM, Drizzle)?

Prisma wins for agent development because:
- Schema is in a single `schema.prisma` file — agents have one place to look
- Migration system is reliable and rollback-safe
- Generated client is type-safe and self-documenting
- Query API is intuitive and consistent

TypeORM has too many ways to do things, leading to inconsistent agent output. Drizzle is excellent but the migration story is less mature.

### Why AWS Cognito (not Auth0, Supabase Auth, custom)?

Client context: most enterprise clients already have AWS infrastructure and want Cognito for SSO. We built for that reality.

If the client uses Auth0 or Supabase, the swap is isolated to `apps/api/src/auth/strategies/jwt.strategy.ts`. The rest of the stack is unchanged.

### Why React + Vite (not Next.js)?

- Simpler mental model for agents (no SSR/SSG complexity)
- Fast dev server with HMR
- Orval-generated client works cleanly without server-side considerations
- Deployment is static files behind a CDN (no server to manage)

If the client needs SSR for SEO, this is revisited per project.

### Why TanStack Router (not React Router, Next.js routing)?

- Type-safe routing with TypeScript generics
- File-based routing is optional (we use code-based for agent predictability)
- Integrated with TanStack Query for loaders
- Explicit is better than magic for agents

### Why shadcn/ui (not MUI, Chakra, Mantine)?

- Components live in the repo — agents can read and modify them
- Tailwind-based — agents understand Tailwind
- No version lock-in — copy-paste model means you own the code
- Beautiful defaults that don't need designer input for MVP

---

## Consequences

**Positive:**
- Single git clone for the full stack
- Types shared without npm publishing
- Worktree-based parallelism is straightforward
- Turborepo cache makes CI fast

**Negative:**
- `pnpm` is required (not everyone has it)
- Turborepo adds a learning curve for new engineers
- Monorepo can slow `git status` and `git log` in large repos (>100k files)

**Mitigations:**
- `scripts/boot.sh` handles pnpm installation check
- Turborepo docs are linked in AGENTS.md
- `.gitignore` is comprehensive to reduce tracked files

---

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Separate repos (api + web) | No shared types, agents need context from both |
| npm workspaces | Slower installs, worse hoisting behavior |
| Nx | More complex than needed; Turborepo is sufficient |
| Express | No structure, agents produce inconsistent code |
| Next.js (full-stack) | SSR complexity makes agent worktree isolation harder |
