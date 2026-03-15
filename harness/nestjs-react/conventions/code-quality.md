# Code Quality Conventions

Rules optimized for agent-authored codebases. Enforced by linters and CI — not suggestions.

## File Size (Source Code Only)

Applies to: `.ts`, `.tsx`, `.css` files.
Excludes: `.sql`, `.json`, `.prisma`, `.md`, generated files, `*.spec.ts`, `*.e2e-spec.ts`.

| Metric | Limit |
|--------|-------|
| Target | 150 lines |
| Hard max | 200 lines |
| Controllers | 100 lines |

Linter error at hard max:
> "FILE_TOO_LARGE: {{file}} is {{lines}} lines (max 200). Split by responsibility. Each file should have one reason to change. See docs/architecture.md"

Why: Agents load files into context repeatedly (read → edit → verify). Large files burn context budget and increase hallucination risk.

## Function Length

| Metric | Limit |
|--------|-------|
| Max body lines | 25 |
| Max cyclomatic complexity | 8 |
| Max nesting depth | 3 |

Early returns over nested conditionals. No nested ternaries.

## Test Coverage

**100% line coverage. No exceptions.**

Rationale (from Logic.inc's production experience):
- At 95%, you're making judgment calls about what to skip
- At 100%, the coverage report IS the todo list — zero ambiguity
- Forces deletion of unreachable code
- Every line has an executable example of how it behaves

Rules:
- Every public service method gets a test
- Test mirrors source: `billing.service.ts` → `billing.service.spec.ts`
- One logical assertion per test (describe blocks group scenarios)
- Test names read as sentences: "should throw when user not found"
- Arrange-Act-Assert structure, always
- Use factories (faker) for test data. Never hardcode values.

## Naming

### Files
- kebab-case, always suffixed: `*.service.ts`, `*.controller.ts`, `*.repository.ts`, `*.dto.ts`, `*.guard.ts`, `*.filter.ts`
- Directory = domain: `billing/invoice.service.ts` not `utils/helpers.ts`
- No barrel re-exports deeper than 1 level

### Code
- Classes: PascalCase with suffix (`BillingService`, not `Billing`)
- No abbreviations in public APIs: `getUserById`, not `getUsrById`
- Types carry semantic meaning: `UserId`, `WorkspaceSlug`, not `T` or `string`

## Dependencies

- Max 5 constructor injections per class (more = god object, split it)
- No circular dependencies
- Prefer "boring" tech — composable, API-stable, well-represented in training data
- Reimplement small utilities rather than pulling opaque packages (when the utility is <50 lines and needs tight integration)

## Zero Tolerance (Auto-Fail CI)

| Rule | Fix |
|------|-----|
| `any` usage | Use `unknown` + type narrowing |
| `console.log` in production | Use structured logger |
| Commented-out code | Delete it. Git has history. |
| Magic numbers/strings | Extract to named constants |
| `@ts-ignore` / `@ts-expect-error` | Only with linked issue comment |
| Raw Prisma objects in responses | Map to typed DTOs |
| `.skip` or `xit` in tests | Only with linked issue comment |

## Enforced But Flexible (What, Not How)

| Invariant | Agent Chooses |
|-----------|--------------|
| Parse data at boundary | Zod, class-validator, custom — any works |
| Structured logging | Format enforced, library flexible |
| Error handling | Throw NestJS exceptions, never manual error objects |
| API input validation | DTOs required, decorator style is up to agent |

## Explicitly Not Enforced

- Import ordering (Prettier handles it)
- Max module count per domain (organic growth is fine)
- DTO field count (API design review catches this)
- Code style beyond Prettier config (agent output doesn't need to match human aesthetics)

## Boot Time Budget

- Full boot (`install + migrate + seed + dev`): under 60 seconds
- Seed script: under 5 seconds (use factories in tests, not heavy seeds)
- Migration squash: when total exceeds 20 per domain
- `pnpm check:all` (linters): under 10 seconds
- Full test suite: under 120 seconds
