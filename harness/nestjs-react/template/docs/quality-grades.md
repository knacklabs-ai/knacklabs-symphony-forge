# Quality Grades

Each domain is graded A-F based on these criteria. Use this rubric when reviewing PRs and when assessing agent output.

## Grading Rubric

### A — Production Ready

- All happy paths implemented and tested (>80% coverage)
- All failure modes handled with proper error responses
- Input validation on every endpoint (class-validator + transformation)
- Integration tests covering the critical flows
- Swagger documentation complete and accurate
- Structural linters pass
- Performance: no N+1 queries, indexes on foreign keys and filter columns

### B — Solid Foundation

- Core flows implemented and tested (>60% coverage)
- Most failure modes handled (missing edge cases documented)
- Input validation present on primary endpoints
- At least one integration test per controller
- Swagger annotations on all endpoints

### C — Functional

- Core flows work
- Basic error handling (400/404/500 responses)
- Unit tests for service layer
- TypeScript strict mode passes
- Structural linters pass

### D — Incomplete

- Some flows broken or untested
- Missing error handling on critical paths
- No integration tests
- TypeScript errors or `any` types present

### F — Broken

- Core flows don't work
- No tests
- Structural violations flagged by linters
- Application fails to start

---

## Domain Grades

| Domain | Grade | Notes |
|--------|-------|-------|
| auth | C | Core JWT validation works; missing refresh token rotation, missing rate limiting |
| health | A | Simple and complete |

_Update this table as domains are built out._

---

## Grade Assessment Checklist

Run this when evaluating a domain:

**Coverage:**
```bash
pnpm --filter api test --coverage
# Check: does the domain hit >80%?
```

**Structural integrity:**
```bash
pnpm check:all
# Must pass with 0 violations
```

**TypeScript:**
```bash
pnpm typecheck
# Must pass with 0 errors (strict mode)
```

**Endpoint review:**
- Every endpoint has Swagger `@ApiOperation` and `@ApiResponse` decorators
- Every endpoint validates input with `@Body()` DTOs using class-validator
- Every endpoint handles the failure cases documented in `docs/api-patterns.md`

**Performance:**
- Run Prisma query explain on any query joining 3+ tables
- Add indexes for any column used in `WHERE` clauses or `ORDER BY`

---

## Raising a Grade

To raise a domain from C to B:
1. Identify gaps from the rubric above
2. Write the missing tests first (TDD)
3. Implement the missing behavior
4. Re-run the checklist
5. Update the table above

Don't mark a grade higher than what the rubric says. This is a signal to the team, not a vanity metric.
