import { createZodDto } from 'nestjs-zod';
import { htmxArray } from 'src/util';
import { z } from 'zod';

const CreateAuthorSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    authorId: htmxArray(z.coerce.number()),
    authorName: htmxArray(z.string()),
  })
  .refine((x) => x.authorId.length === x.authorName.length)
  .transform((x) => ({
    name: x.name,
    description: x.description,
    selectedAuthors: x.authorId.map((id, idx) => ({
      id,
      name: x.authorName[idx],
    })),
  }));

export class CreateAuthorDto extends createZodDto(CreateAuthorSchema) {}
