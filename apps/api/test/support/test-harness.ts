/**
 * Integration test harness.
 * See conventions/testing.md — Integration Tests section.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';

// Lazily imported to avoid coupling at import time
let appModule: typeof import('../../src/app.module');

class RollbackSignal extends Error {
  constructor() {
    super('__ROLLBACK__');
  }
}

export async function createTestApp(): Promise<INestApplication> {
  appModule = await import('../../src/app.module');

  const module: TestingModule = await Test.createTestingModule({
    imports: [appModule.AppModule],
  }).compile();

  const app = module.createNestApplication();

  // Mirror main.ts bootstrap (must stay in sync)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Transaction rollback wrapper.
 * Rolls back every database write after each test — no truncation, no ordering issues.
 *
 * Usage:
 *   const tx = withTransaction(app);
 *   it('...', () => tx.run(async (prisma) => { ... }));
 */
export function withTransaction(app: INestApplication) {
  const prisma = app.get(PrismaService);

  return {
    async run(fn: (prisma: PrismaService) => Promise<void>): Promise<void> {
      try {
        await prisma.$transaction(async (tx) => {
          await fn(tx as unknown as PrismaService);
          throw new RollbackSignal();
        });
      } catch (error) {
        if (!(error instanceof RollbackSignal)) {
          throw error;
        }
      }
    },
  };
}
