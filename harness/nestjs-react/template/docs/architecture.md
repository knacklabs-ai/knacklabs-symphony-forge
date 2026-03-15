# Architecture

## Layer Model

```
┌─────────────────────────────────────────┐
│  UI (React, routes, components)         │  apps/web/src/
├─────────────────────────────────────────┤
│  Runtime (controllers, guards, filters) │  apps/api/src/*/controller, guard
├─────────────────────────────────────────┤
│  Service (business logic)               │  apps/api/src/*/service
├─────────────────────────────────────────┤
│  Repository (DB access via Prisma)      │  apps/api/src/*/repository
├─────────────────────────────────────────┤
│  Config (env, constants)                │  apps/api/src/config/
├─────────────────────────────────────────┤
│  Types (interfaces, DTOs, Zod schemas)  │  packages/shared/src/
└─────────────────────────────────────────┘
```

**Dependency direction: downward only.** Each layer may only import from layers below it.

| Layer | May import from |
|-------|----------------|
| UI | Runtime (via typed API client), Types |
| Runtime | Service, Types |
| Service | Repository, Config, Types |
| Repository | Config, Types |
| Config | Types |
| Types | Nothing (no imports from other layers) |

**Violations are caught by `linters/check-imports.ts`.**

## Domain Boundaries

The API is organized into domains. Each domain is a NestJS module with its own:
- Controller (HTTP endpoints)
- Service (business logic)
- Optional repository (if it has direct DB access)
- DTOs (request/response shapes)

### Current Domains

| Domain | Responsibility |
|--------|---------------|
| `auth` | Authentication via AWS Cognito, JWT validation |
| `health` | Health check endpoints |
| `prisma` | Shared Prisma client (not a domain — shared infrastructure) |

### Cross-Domain Rules

**Domains do not import each other directly.** If Domain A needs a type from Domain B:
1. Move the type to `packages/shared/src/types/`
2. Both domains import from shared

**The `auth` module is the only exception.** Its guards are imported by other domains to protect routes. This is intentional.

If you're unsure whether something should be in shared: ask "would two different domains ever need this?" If yes, shared. If no, keep it in the domain.

## Directory Conventions

### API (`apps/api/src/`)

```
src/
├── main.ts              App bootstrap
├── app.module.ts        Root module (imports all domain modules)
├── app.controller.ts    Root routes (ping, version)
├── app.service.ts       Root service
├── common/              Cross-cutting concerns (not domain-specific)
│   ├── filters/         Exception filters
│   ├── pipes/           Validation pipes
│   ├── interceptors/    Logging, transform interceptors
│   └── decorators/      Custom parameter decorators
├── config/              Environment config (optional, use @nestjs/config)
├── prisma/              PrismaService and PrismaModule
├── auth/                Auth domain
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/          JwtAuthGuard, RolesGuard
│   ├── strategies/      JWT passport strategy
│   └── dto/             LoginDto, TokenResponseDto
└── <domain>/            Your domain modules follow this same pattern
    ├── <domain>.module.ts
    ├── <domain>.controller.ts
    ├── <domain>.service.ts
    ├── <domain>.repository.ts   (if domain owns DB tables)
    └── dto/
```

### Web (`apps/web/src/`)

```
src/
├── main.tsx             React entry point
├── App.tsx              Router + providers setup
├── routes/              TanStack Router routes
│   ├── __root.tsx       Root layout (nav, auth wrapper)
│   ├── index.tsx        Dashboard
│   └── login.tsx        Login page
├── lib/
│   ├── api-client.ts    orval-generated typed client (auto-generated)
│   ├── query-client.ts  TanStack Query configuration
│   └── utils.ts         Shared utilities (cn, formatDate, etc.)
├── components/
│   └── ui/              shadcn/ui components
├── hooks/               Custom React hooks (use-auth, use-debounce, etc.)
└── stores/              Zustand stores (auth-store, etc.)
```

## Error Handling

All errors returned from the API follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "must be a valid email address"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/users"
}
```

`AllExceptionsFilter` handles this. Never throw raw errors from controllers.

## Auth Flow

```
Browser → POST /auth/login (Cognito credentials)
       ← { accessToken, refreshToken, user }

Browser → GET /api/resource (Authorization: Bearer <accessToken>)
        → JwtAuthGuard validates token against Cognito JWKS
        → @CurrentUser() decorator injects user into handler
       ← Resource data
```

Cognito issues JWTs. Our JWT strategy validates them against the Cognito public keys (fetched at startup). We don't issue our own JWTs.

## Observability

- **Logging:** `LoggingInterceptor` logs every request with method, path, status, and duration
- **Health:** `/health` endpoint returns status of DB, Redis, and app
- **Swagger:** Available at `/api/docs` in development

## Making Architecture Changes

Architecture changes require:
1. Updating this document
2. Updating `linters/check-imports.ts` if layer rules change
3. An ADR in `docs/adr/` explaining the decision
4. Updating `AGENTS.md` if the directory structure changes
