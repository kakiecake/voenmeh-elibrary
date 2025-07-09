import { applyDecorators, SetMetadata, UseFilters } from '@nestjs/common';
import { AuthExceptionFilter } from 'src/auth.exception-filter';

export const Protected = applyDecorators(
  SetMetadata('protected', true),
  UseFilters(AuthExceptionFilter),
);
