import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AddAuthorToListDtoSchema = z
  .object({
    newAuthor: z.object({ id: z.coerce.number(), name: z.string() }),
    id: z.union([
      z.coerce
        .number()
        .optional()
        .transform((x) => (x ? [x] : [])),
      z.array(z.coerce.number()),
    ]),
    name: z.union([
      z
        .string()
        .optional()
        .transform((x) => (x ? [x] : [])),
      z.array(z.string()),
    ]),
  })
  .refine(({ id, name }) => id.length === name.length)
  .transform((obj) => ({
    newAuthor: obj.newAuthor,
    authors: obj.id.map((id, idx) => ({ id, name: obj.name[idx] })),
  }));

export class AddAuthorToListDto extends createZodDto(
  AddAuthorToListDtoSchema,
) {}
