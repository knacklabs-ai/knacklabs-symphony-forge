# Symphony Forge

Production system for building client software using OpenAI Symphony + harness engineering.

## What This Is

Symphony Forge is a complete kit for going from client idea to shipped software using:
- **Discovery** — A structured intake process that drives toward a precise spec
- **Harness** — A battle-tested monorepo template (NestJS + React) that agents can work in without stepping on each other
- **Symphony** — OpenAI's multi-agent coding system, configured to run parallel worktrees on Linear issues

## Structure

```
symphony-forge/
├── skill/SKILL.md        # OpenClaw discovery skill — invoke this for new projects
├── harness/nestjs-react/ # The monorepo template + scaffold tooling
├── projects/             # Per-client project workspaces (gitignored)
└── docs/                 # Philosophy, setup guides, process docs
```

## Quick Start

### Starting a New Client Project

In OpenClaw, say:
> "New project: [client name] — [brief description]"

The discovery skill will guide you through intake.

### Scaffolding a Harness

Once discovery is complete and `PROJECT_SPEC.md` is written:

```bash
./harness/nestjs-react/scaffold.sh my-project-name /path/to/output
```

This stamps out a production-ready monorepo from the template with your project's name and config baked in.

### Running Symphony

After scaffolding, the `WORKFLOW.md` at the repo root configures Symphony. Connect it to your Linear workspace and start the agent:

```bash
# From the scaffolded project root
symphony run
```

## The Philosophy

Traditional dev shops treat agents as autocomplete. We treat them as parallel junior developers. Each agent gets:
- Its own git worktree (isolated from other agents)
- Its own database (unique port, docker compose overlay)
- Its own app server (no port conflicts)
- A fully booted environment ready in < 2 minutes

The harness is what makes this possible. Without it, agents collide. With it, you can run 10 in parallel on the same repo.

Read [docs/harness-philosophy.md](docs/harness-philosophy.md) for the full argument.

## Stack

**Backend:** NestJS · Prisma · PostgreSQL · Redis · AWS Cognito  
**Frontend:** React · Vite · TanStack Router · TanStack Query · Zustand · shadcn/ui  
**Tooling:** pnpm workspaces · Turborepo · orval · vitest · GitHub Actions

## Docs

- [Getting Started](docs/getting-started.md)
- [Harness Philosophy](docs/harness-philosophy.md)
- [Validation Loop](docs/validation-loop.md)
- [Symphony Setup](docs/symphony-setup.md)
