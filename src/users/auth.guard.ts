import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { User } from './types';
import { AUTH_TOKEN_COOKIE_NAME, JWT_SECRET_SYMBOL } from './constants';
import { Reflector } from '@nestjs/core';

export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @Inject(JWT_SECRET_SYMBOL) private readonly authSecret: string,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>();
    const isProtected = this.reflector.get<boolean>(
      'protected',
      ctx.getHandler(),
    );

    const token = this.extractTokenFromRequest(req);
    if (!token) return !isProtected;

    const payload = await this.jwtService
      .verifyAsync<
        Pick<User, 'id' | 'email' | 'role'>
      >(token, { secret: this.authSecret })
      .catch((err) => err as Error);

    if (payload instanceof Error) {
      return !isProtected;
    }

    req['user'] = payload;

    return true;
  }

  private extractTokenFromRequest(req: Request): string | null {
    return (req.cookies[AUTH_TOKEN_COOKIE_NAME] as string) ?? null;
  }
}
