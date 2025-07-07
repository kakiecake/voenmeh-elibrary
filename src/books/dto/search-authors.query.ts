import { createZodDto } from 'nestjs-zod';
import { htmxArray } from 'src/util';
import { z } from 'zod';

const SearchAuthorsSchema = z.object({
  q: z.string(),
  excludeIds: htmxArray(z.coerce.number()),
});

export class SearchAuthorsQuery extends createZodDto(SearchAuthorsSchema) {}
