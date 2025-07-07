import { createZodDto } from 'nestjs-zod';
import { htmxArray } from '../../util';
import { z } from 'zod';

const GetAuthorCreationFormSchema = z
  .object({
    id: htmxArray(z.coerce.number()),
    name: htmxArray(z.string()),
    q: z.string(),
  })
  .refine((x) => x.id.length === x.name.length)
  .transform((x) => ({
    selectedAuthors: x.id.map((id, idx) => ({ id, name: x.name[idx] })),
    query: x.q,
  }));

export class GetAuthorCreationFormQuery extends createZodDto(
  GetAuthorCreationFormSchema,
) {}
