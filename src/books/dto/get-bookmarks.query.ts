import { z } from 'zod';
import { PaginationSchema } from './pagination.query';
import { createZodDto } from 'nestjs-zod';

const GetBookmarksSchema = PaginationSchema.extend({
  partial: z
    .string()
    .optional()
    .transform((x) => !!x),
});

export class GetBookmarksQuery extends createZodDto(GetBookmarksSchema) {}
