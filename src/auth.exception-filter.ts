import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(ForbiddenException, UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(_: UnauthorizedException, host: ArgumentsHost) {
    const res: Response = host.switchToHttp().getResponse();
    res.status(404).render('404');
  }
}
