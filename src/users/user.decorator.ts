import { createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { User } from './types';

export type AuthorizedUser = Pick<User, 'id' | 'email' | 'role'>;

export const UserDecorator = createParamDecorator((_, ctx) => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return (req['user'] ?? null) as AuthorizedUser | null;
});
