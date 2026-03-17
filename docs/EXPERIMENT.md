# Experiment: AGENTS.md as Convention Controller

## Hypothesis

A well-structured AGENTS.md + 20 convention files (4080 lines) can produce
production-grade NestJS code from Codex in a single pass — including tests.

## Control Variables

| Variable | Value |
|----------|-------|
| Agent | Codex CLI 0.114.0 (gpt-5.4-codex) |
| Mode | `--full-auto` |
| Auth | chatgpt (ios-devices@cawstudios.com) |
| Prompt | "Read AGENTS.md, then projects/task-tracker/PLAN.md. Build the task tracker API." |
| Harness | 89 files, 4080 convention lines, 103-line AGENTS.md |
| Baseline | 0 source files, 0 test files |

## Historical Comparison

| Metric | R1 (Mar 16) | R2 (Mar 16) | R3 (this) |
|--------|------------|------------|-----------|
| Source files | 57 | 70 | ? |
| Test files | 0 | 0 | ? |
| AppException pattern | ❌ | ✅ | ? |
| Structured logging | ❌ | ✅ | ? |
| Correlation IDs | ❌ | ✅ | ? |
| Linter pass (5/5) | N/A | N/A | ? |
| File size ≤200 | ? | ? | ? |
| Zero `any` | ? | ? | ? |
| Zero `console.log` | ? | ? | ? |
| Coverage thresholds | N/A | N/A | ? |

## Changes Since R2

1. AGENTS.md rewritten to v4 (~100 lines, map-not-manual)
2. Test-gating rule: "MUST NOT move to next module until current has 100% coverage"
3. Harness stripped of test-project contamination (Proof SDK, Azure AD)
4. Generic PLAN.md (task tracker) instead of KnackLabs-specific
5. Build artifacts cleaned, stale code deleted

## Post-Run Audit Checklist

- [ ] Count source files in apps/api/src/
- [ ] Count test files (*.spec.ts)
- [ ] Run 5 structural linters
- [ ] grep for `any` (non-comment, non-type-guard)
- [ ] grep for `console.log`
- [ ] grep for `@ts-ignore`
- [ ] Check AppException usage (no raw HttpException)
- [ ] Check pino logger usage (no console)
- [ ] Check correlation ID middleware
- [ ] Check factory files created
- [ ] Check coverage config (100% thresholds)
- [ ] Attempt `pnpm test` (if deps installed)
