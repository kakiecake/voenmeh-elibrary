import { createZodDto } from 'nestjs-zod';
import { htmxArray } from 'src/util';
import { z } from 'zod';
import { PaginationSchema } from './pagination.query';

const SearchAuthorsSchema = PaginationSchema.extend({
  q: z.string(),
  excludeIds: htmxArray(z.coerce.number()),
});

export class SearchAuthorsQuery extends createZodDto(SearchAuthorsSchema) {}
