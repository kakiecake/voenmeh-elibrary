import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateBookDtoSchema = z.object({
  title: z.string(),
  description: z.string(),
  authorIds: z.union([
    z.array(z.coerce.number()),
    z.coerce
      .number()
      .optional()
      .transform((x) => (x ? [x] : [])),
  ]),
  yearCreated: z.coerce.number().positive(),
  countryCode: z.string().length(2),
});

export class CreateBookDto extends createZodDto(CreateBookDtoSchema) {}
