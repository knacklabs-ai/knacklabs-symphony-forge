import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds an existing user by Cognito sub, or creates one on first login.
   * Called by the JWT strategy after token validation.
   */
  async findOrCreateUser(claims: Pick<AuthUser, 'sub' | 'email'>): Promise<{
    id: string;
    cognitoId: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const existing = await this.prisma.user.findUnique({
      where: { cognitoId: claims.sub },
    });

    if (existing) {
      return existing;
    }

    this.logger.log(`Creating new user for Cognito sub: ${claims.sub}`);

    return this.prisma.user.create({
      data: {
        cognitoId: claims.sub,
        email: claims.email,
      },
    });
  }

  /**
   * Returns the public profile for a Cognito user.
   * Used by /auth/profile and /auth/me endpoints.
   */
  async getProfile(user: AuthUser) {
    const dbUser = await this.findOrCreateUser({
      sub: user.sub,
      email: user.email,
    });

    return {
      id: dbUser.id,
      cognitoId: dbUser.cognitoId,
      email: dbUser.email,
      groups: user['cognito:groups'] || [],
      createdAt: dbUser.createdAt,
    };
  }
}
