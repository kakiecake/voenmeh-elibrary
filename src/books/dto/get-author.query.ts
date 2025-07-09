import { z } from 'zod';
import { PaginationSchema } from './pagination.query';
import { createZodDto } from 'nestjs-zod';

const GetAuthorSchema = PaginationSchema.extend({
  partial: z
    .string()
    .optional()
    .transform((x) => !!x),
});

export class GetAuthorQuery extends createZodDto(GetAuthorSchema) {}
