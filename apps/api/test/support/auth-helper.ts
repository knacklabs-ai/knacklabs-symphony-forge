/**
 * Mock JWT injection for integration tests.
 * See conventions/testing.md — Mock JWT Injection section.
 *
 * Never use real auth flows in tests.
 */
import { SignJWT } from 'jose';

// Must match TEST_JWT_SECRET in .env.test
const TEST_SECRET =
  process.env['TEST_JWT_SECRET'] ?? 'test-jwt-secret-do-not-use-in-prod';

export interface TestClaims {
  sub?: string;
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'MEMBER';
  [key: string]: unknown;
}

const secret = new TextEncoder().encode(TEST_SECRET);

export async function mockJwt(claims: TestClaims = {}): Promise<string> {
  return new SignJWT({
    sub: claims.sub ?? 'user-test-123',
    email: claims.email ?? 'test@test.com',
    name: claims.name ?? 'Test User',
    role: claims.role ?? 'MEMBER',
    ...claims,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

export async function authHeader(
  claims: TestClaims = {},
): Promise<Record<string, string>> {
  return { Authorization: `Bearer ${await mockJwt(claims)}` };
}

export function adminAuthHeader(): Promise<Record<string, string>> {
  return authHeader({
    role: 'ADMIN',
    sub: 'admin-test-123',
    email: 'admin@test.com',
  });
}
