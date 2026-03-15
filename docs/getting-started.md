# Getting Started with Symphony Forge

Symphony Forge is a harness for building agent-ready NestJS + React monorepos. It gives you a bootable, structurally-sound starting point that coding agents can navigate and extend without making architectural mistakes.

---

## Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| Node.js | 20.x | [nodejs.org](https://nodejs.org) |
| pnpm | 9.x | `npm install -g pnpm@9` |
| Docker Desktop | any recent | [docker.com](https://www.docker.com) |
| Git | 2.x | pre-installed on most systems |

Verify your setup:

```bash
node --version    # v20.x.x
pnpm --version    # 9.x.x
docker --version  # Docker version 24.x.x
git --version     # git version 2.x.x
```

---

## Scaffold a New Project

```bash
# Clone symphony-forge (or use the CLI when available)
git clone https://github.com/your-org/symphony-forge
cd symphony-forge

# Scaffold a new project from the harness
pnpm scaffold --template nestjs-react --name my-app --output ~/projects/my-app

# Move into your new project
cd ~/projects/my-app
```

The scaffolder replaces all `{{PROJECT_NAME}}`, `{{PORT_BASE}}`, `{{DB_PORT}}`, `{{WEB_PORT}}`, and `{{REDIS_PORT}}` placeholders with real values.

---

## Boot the Environment

```bash
# From your project root
./scripts/boot.sh
```

This single command:
1. Checks Docker is running
2. Starts Postgres and Redis via Docker Compose
3. Installs pnpm dependencies (`--frozen-lockfile`)
4. Waits for Postgres to be ready
5. Applies Prisma migrations
6. Seeds the database
7. Prints the URLs for your API and web app

Expected output:
```
╔══════════════════════════════════════════════════╗
║  ✅  Boot complete!                               ║
╠══════════════════════════════════════════════════╣
║  API  →  http://localhost:3000                   ║
║  Web  →  http://localhost:5173                   ║
║  DB   →  localhost:5432                          ║
║                                                  ║
║  Start dev servers:  pnpm dev                    ║
║  API docs:           http://localhost:3000/api/docs ║
╚══════════════════════════════════════════════════╝
```

---

## Start Dev Servers

```bash
pnpm dev
```

Turbo runs all apps in parallel with hot-reload:
- **API** → http://localhost:3000 (NestJS with Swagger at `/api/docs`)
- **Web** → http://localhost:5173 (Vite + React)

---

## Verify Everything Works

```bash
# Health check
curl http://localhost:3000/health

# API docs
open http://localhost:3000/api/docs

# Web app
open http://localhost:5173

# Run all tests
pnpm test

# Run structural checks
pnpm check:all
```

---

## Next Steps

| Task | Command / Doc |
|------|--------------|
| Add a domain module | See `AGENTS.md` → "Add a New Domain Module" |
| Update the database schema | `pnpm db:migrate` |
| Generate typed API client | `pnpm generate:api-client` |
| Work with worktrees (Symphony) | `./scripts/setup-worktree.sh <branch>` |
| Architecture rules | `docs/architecture.md` |
| Validation loop | `docs/validation-loop.md` |
| Configure Symphony | `docs/symphony-setup.md` |

---

## Troubleshooting

**Docker not running:**
```
❌  Docker is not running. Start Docker Desktop and retry.
```
→ Open Docker Desktop and wait for it to fully start, then re-run `./scripts/boot.sh`.

**Port already in use:**
```
Error: listen EADDRINUSE :::3000
```
→ Another process is using port 3000. Either kill it (`lsof -ti:3000 | xargs kill`) or use a worktree with a different port offset.

**Prisma migration errors:**
```
Error: P1001: Can't reach database server
```
→ Postgres isn't ready yet. Run `./scripts/boot.sh` again (it waits for Postgres readiness).

**pnpm install fails with frozen-lockfile:**
```
ERR_PNPM_OUTDATED_LOCKFILE
```
→ Your lockfile is out of date. Run `pnpm install` (without `--frozen-lockfile`) once to update it, then commit the updated `pnpm-lock.yaml`.
