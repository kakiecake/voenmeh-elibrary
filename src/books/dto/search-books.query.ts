import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationSchema } from './pagination.query';

const SearchBooksQuerySchema = PaginationSchema.extend({
  q: z.string().optional(),
  partial: z
    .string()
    .optional()
    .transform((x) => !!x),
});

export class SearchBooksQueryDto extends createZodDto(SearchBooksQuerySchema) {}
