import { applyDecorators, SetMetadata, UseFilters } from '@nestjs/common';
import { AuthExceptionFilter } from 'src/auth.exception-filter';

export const Protected = (params?: { adminOnly?: boolean }) =>
  applyDecorators(
    SetMetadata('adminOnly', !!params?.adminOnly),
    SetMetadata('protected', true),
    UseFilters(AuthExceptionFilter),
  );
