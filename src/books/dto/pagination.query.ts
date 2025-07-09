import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
});

export class PaginationQuery extends createZodDto(PaginationSchema) {}
