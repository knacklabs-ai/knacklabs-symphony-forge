# Testing Strategy

## Test Pyramid

```
         ┌──────────────┐
         │  E2E Tests   │  Playwright — critical user journeys
         │  (slowest)   │  ~10-20 tests
         ├──────────────┤
         │ Integration  │  Supertest — API endpoints with real DB
         │   Tests      │  ~50-100 tests
         ├──────────────┤
         │  Unit Tests  │  Vitest — services, utils, transforms
         │  (fastest)   │  ~200+ tests
         └──────────────┘
```

## Unit Tests (Vitest)

**What to test:**
- Service methods (business logic)
- Utility functions (date formatting, string transforms, calculations)
- Validation logic
- Repository methods (with mocked Prisma)

**Location:** Co-located with source files, `*.spec.ts` pattern

**Run:**
```bash
pnpm test                    # All unit tests
pnpm --filter api test       # API tests only
pnpm --filter web test       # Web tests only
pnpm test -- --watch         # Watch mode
pnpm test -- --coverage      # With coverage report
```

**Example — Service test:**
```typescript
// auth.service.spec.ts
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    authService = module.get(AuthService);
    prisma = module.get(PrismaService);
  });

  describe('findOrCreateUser', () => {
    it('creates a new user on first login', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        cognitoId: 'cognito-sub-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await authService.findOrCreateUser({
        sub: 'cognito-sub-123',
        email: 'test@example.com',
      });

      expect(user.cognitoId).toBe('cognito-sub-123');
      expect(prisma.user.create).toHaveBeenCalledOnce();
    });

    it('returns existing user on subsequent logins', async () => {
      const existingUser = {
        id: 'uuid-1',
        cognitoId: 'cognito-sub-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(existingUser);

      const user = await authService.findOrCreateUser({
        sub: 'cognito-sub-123',
        email: 'test@example.com',
      });

      expect(user.id).toBe('uuid-1');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
});
```

## Integration Tests (Supertest)

**What to test:**
- Full request/response cycles through the HTTP layer
- Auth guard behavior
- Input validation rejection
- Database state changes

**Location:** `apps/api/test/` directory, `*.e2e-spec.ts` pattern

**Run:**
```bash
pnpm --filter api test:e2e
```

**Setup:** Uses a real test database (separate from dev). The `TEST_DATABASE_URL` env var must be set.

**Example:**
```typescript
// app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up between tests
    await prisma.user.deleteMany();
  });

  it('GET /health returns 200', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('GET /api/v1/auth/profile returns 401 without token', () => {
    return request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401);
  });
});
```

## E2E Tests (Playwright)

**What to test:**
- Critical user journeys end-to-end (login → do a thing → see result)
- Keep this layer thin — only the flows that would cost the most if broken

**Location:** `apps/web/e2e/` directory

**Run:**
```bash
pnpm --filter web test:e2e
```

**Example:**
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'TestPassword123!');
  await page.click('[data-testid="submit"]');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## Structural Tests (Custom Linters)

**What to test:**
- Import direction violations
- Cross-domain boundary violations
- Doc freshness

**Run:**
```bash
pnpm check:all
```

These run in CI on every PR. Violations block merge.

## Coverage Requirements

| Layer | Target | Enforce in CI |
|-------|--------|---------------|
| Services | >80% | Yes |
| Controllers | >60% | No (integration tests cover these) |
| Repositories | >70% | Yes |
| Utils | >90% | Yes |
| UI components | >40% | No |

## Test Data

Use factories for test data, not hardcoded objects:

```typescript
// test/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export function createUserData(overrides = {}) {
  return {
    cognitoId: faker.string.uuid(),
    email: faker.internet.email(),
    ...overrides,
  };
}
```

Never share test data between test files. Each test owns its data.
