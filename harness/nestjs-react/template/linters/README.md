# Structural Linters

These linters exist to stop agent drift before it becomes architecture debt.

## Commands

```bash
pnpm check:imports
pnpm check:boundaries
pnpm check:docs
pnpm check:all
```

## Rules

- `check-imports.ts` enforces layer direction: Types → Config → Repo → Service → Runtime → UI
- `check-boundaries.ts` blocks direct imports across domain folders
- `check-docs.ts` verifies docs referenced from `AGENTS.md` actually exist and are fresh enough to trust

## Output style

Every failure includes:
1. The violating file
2. What rule was broken
3. Exactly how to remediate it

If the error message does not tell an agent what to do next, the linter failed its job.
