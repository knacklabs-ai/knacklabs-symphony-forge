# API Patterns

Conventions for the NestJS API. Every endpoint must follow these patterns. Agents: read this before writing controllers.

## Base URL

```
http://localhost:{PORT}/api/v1
```

All routes are prefixed with `/api/v1`. Swagger is at `/api/docs`.

## REST Conventions

| Operation | Method | Path | Response |
|-----------|--------|------|----------|
| List | GET | `/resources` | 200 + paginated array |
| Get one | GET | `/resources/:id` | 200 + object, 404 if not found |
| Create | POST | `/resources` | 201 + created object |
| Update | PATCH | `/resources/:id` | 200 + updated object, 404 if not found |
| Replace | PUT | `/resources/:id` | 200 + replaced object, 404 if not found |
| Delete | DELETE | `/resources/:id` | 204 no content, 404 if not found |

## Error Format

All errors use this shape:

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  errors?: FieldError[];
  timestamp: string;
  path: string;
}

interface FieldError {
  field: string;
  message: string;
}
```

**Examples:**

```json
// 400 Validation Error
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "must be a valid email address" },
    { "field": "password", "message": "must be at least 8 characters" }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/auth/login"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/users/abc-123"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/resources"
}
```

`AllExceptionsFilter` handles all of this. Never construct error responses manually — throw NestJS exceptions:

```typescript
throw new NotFoundException('User not found');
throw new BadRequestException('Email is already in use');
throw new UnauthorizedException('Invalid token');
throw new ForbiddenException('You do not have permission');
throw new ConflictException('Resource already exists');
```

## Pagination

List endpoints that can return many items use cursor-based pagination:

**Request:**
```
GET /api/v1/users?limit=20&cursor=<cursor>
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "cursor": "eyJpZCI6ImFiYy0xMjMifQ==",
    "hasMore": true,
    "total": 142
  }
}
```

**DTO:**
```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  cursor?: string;
}
```

**Service:**
```typescript
async findMany(dto: PaginationDto) {
  const items = await this.prisma.resource.findMany({
    take: dto.limit + 1, // Fetch one extra to determine hasMore
    ...(dto.cursor && {
      cursor: { id: this.decodeCursor(dto.cursor) },
      skip: 1,
    }),
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = items.length > dto.limit;
  const data = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? this.encodeCursor(data[data.length - 1].id) : null;

  return { data, pagination: { limit: dto.limit, cursor: nextCursor, hasMore, total: null } };
}
```

## Input Validation

Every POST/PATCH/PUT endpoint validates with class-validator DTOs.

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John', minLength: 1 })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;
}
```

The global `ValidationPipe` (set in `main.ts`) handles transformation and whitelist stripping automatically.

## Authentication

Protected routes use `@UseGuards(JwtAuthGuard)`. Get the current user with `@CurrentUser()`:

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async getProfile(@CurrentUser() user: AuthUser) {
  return this.usersService.findById(user.sub);
}
```

Public routes must be explicitly annotated with `@Public()` (a custom decorator that skips the guard):

```typescript
@Get('public-data')
@Public()
async getPublicData() {
  return this.service.getPublicData();
}
```

## Swagger Annotations

Every endpoint needs:

```typescript
@ApiOperation({ summary: 'Get user by ID' })
@ApiParam({ name: 'id', description: 'User UUID' })
@ApiResponse({ status: 200, description: 'User found', type: UserDto })
@ApiResponse({ status: 404, description: 'User not found' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
```

Run `curl http://localhost:{PORT}/api/docs-json` to see the OpenAPI spec. This is what orval uses to generate the frontend client.

## Response Serialization

Always return typed DTOs, never raw Prisma objects. This ensures:
1. Sensitive fields (passwords, internal IDs) are never leaked
2. The API contract is explicit and testable
3. orval can generate correct TypeScript types

```typescript
// Bad — leaks internal fields
return this.prisma.user.findUnique({ where: { id } });

// Good — explicit contract
const user = await this.prisma.user.findUnique({ where: { id } });
if (!user) throw new NotFoundException('User not found');
return new UserDto(user);
```
