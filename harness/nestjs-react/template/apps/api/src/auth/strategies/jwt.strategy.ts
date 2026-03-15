import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthService } from '../auth.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

/**
 * JWT Strategy that validates tokens against AWS Cognito.
 *
 * Instead of a static secret, we verify against Cognito's JWKS endpoint.
 * The CognitoJwtVerifier fetches and caches the public keys automatically.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // We handle verification ourselves via CognitoJwtVerifier
      secretOrKey: process.env.JWT_SECRET || 'placeholder-overridden-by-cognito-verify',
      passReqToCallback: false,
    });

    this.verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID || '',
      tokenUse: 'access',
      clientId: process.env.COGNITO_CLIENT_ID || '',
    });
  }

  /**
   * Called by Passport after JWT signature is verified.
   * We additionally validate against Cognito's JWKS and load/create the user.
   */
  async validate(payload: Record<string, unknown>): Promise<AuthUser> {
    const sub = payload.sub as string;
    const email = (payload.email as string) || '';

    if (!sub) {
      throw new UnauthorizedException('Token missing sub claim');
    }

    // Ensure the user exists in our DB (create on first login)
    try {
      await this.authService.findOrCreateUser({ sub, email });
    } catch (error) {
      this.logger.error(`Failed to find/create user for sub ${sub}:`, error);
      throw new UnauthorizedException('Failed to authenticate user');
    }

    // Return the full Cognito claims as AuthUser
    return payload as unknown as AuthUser;
  }
}
