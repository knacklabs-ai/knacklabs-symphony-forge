import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Application (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data between tests
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.{{PROJECT_NAME}}.local' } },
    });
  });

  describe('App Root', () => {
    it('GET / returns API info', () => {
      return request(app.getHttpServer())
        .get('/api/v1')
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('{{PROJECT_NAME}}-api');
          expect(res.body.environment).toBeDefined();
        });
    });
  });

  describe('Health', () => {
    it('GET /health returns 200 when DB is connected', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });

    it('GET /health/live returns 200', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Auth', () => {
    it('GET /auth/profile returns 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401)
        .expect((res) => {
          expect(res.body.statusCode).toBe(401);
          expect(res.body.message).toBeDefined();
        });
    });

    it('GET /auth/me returns 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('GET /auth/profile returns 401 with malformed token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer not-a-valid-jwt')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('returns 404 for unknown routes', () => {
      return request(app.getHttpServer())
        .get('/api/v1/this-does-not-exist')
        .expect(404);
    });

    it('error responses include statusCode, message, and timestamp', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401)
        .expect((res) => {
          expect(res.body.statusCode).toBe(401);
          expect(res.body.message).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.path).toBeDefined();
        });
    });
  });
});
