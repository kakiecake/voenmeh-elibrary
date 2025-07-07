import { createZodDto } from 'nestjs-zod';
import { htmxArray } from '../../util';
import { z } from 'zod';

const AddAuthorToListDtoSchema = z
  .object({
    newAuthor: z.object({ id: z.coerce.number(), name: z.string() }),
    id: htmxArray(z.coerce.number()),
    name: htmxArray(z.string()),
  })
  .refine(({ id, name }) => id.length === name.length)
  .transform((obj) => ({
    newAuthor: obj.newAuthor,
    authors: obj.id.map((id, idx) => ({ id, name: obj.name[idx] })),
  }));

export class AddAuthorToListDto extends createZodDto(
  AddAuthorToListDtoSchema,
) {}
