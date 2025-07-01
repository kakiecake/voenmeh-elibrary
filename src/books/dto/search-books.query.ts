import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SearchBooksQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().positive().optional().default(1),
  partial: z
    .string()
    .optional()
    .transform((x) => !!x),
});

export class SearchBooksQueryDto extends createZodDto(SearchBooksQuerySchema) {}
