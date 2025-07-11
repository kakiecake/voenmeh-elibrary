import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { User, USER_ROLES } from './types';
import { AUTH_TOKEN_COOKIE_NAME } from './constants';
import { Reflector } from '@nestjs/core';
import { ConfigSymbol } from '../global.constants';
import { AppConfig } from 'src/config';

export class AuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @Inject(ConfigSymbol) config: AppConfig,
  ) {
    this.jwtSecret = config.jwtSecret;
  }

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>();
    const isProtected = this.reflector.get<boolean>(
      'protected',
      ctx.getHandler(),
    );
    const isAdminOnly = this.reflector.get<boolean>(
      'adminOnly',
      ctx.getHandler(),
    );

    const token = this.extractTokenFromRequest(req);
    if (!token) return !isProtected;

    const payload = await this.jwtService
      .verifyAsync<
        Pick<User, 'id' | 'email' | 'role'>
      >(token, { secret: this.jwtSecret })
      .catch((err) => err as Error);

    if (payload instanceof Error) {
      return !isProtected;
    }

    if (isAdminOnly && payload.role < USER_ROLES.Admin) return false;

    req['user'] = payload;

    return true;
  }

  private extractTokenFromRequest(req: Request): string | null {
    return (req.cookies[AUTH_TOKEN_COOKIE_NAME] as string) ?? null;
  }
}
