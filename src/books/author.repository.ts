import { Inject } from '@nestjs/common';
import { DbSymbol } from '../global.constants';
import { Knex } from 'knex';
import { Author } from './types';

export class AuthorRepository {
  constructor(@Inject(DbSymbol) private readonly db: Knex) {}

  async findAuthors(query: string, excludedIds: number[]): Promise<Author[]> {
    return (await this.db('authors')
      .select('id', 'name')
      .where(this.db.raw('name ilike ?', '%' + query + '%'))
      .and.not.whereIn('id', excludedIds)) as Author[];
  }
}
