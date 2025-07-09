import { Inject } from '@nestjs/common';
import { DbSymbol } from '../global.constants';
import { Knex } from 'knex';
import { Author, Book } from './types';

export class AuthorRepository {
  constructor(@Inject(DbSymbol) private readonly db: Knex) {}

  async findAuthors(
    query: string,
    excludedIds: number[],
    limit: number,
  ): Promise<Author[]> {
    return (await this.db('authors')
      .select('id', 'name')
      .where(this.db.raw('name ilike ?', '%' + query + '%'))
      .and.not.whereIn('id', excludedIds)
      .limit(limit)) as Author[];
  }

  async createAuthor(
    name: string,
    description: string,
  ): Promise<Pick<Author, 'id'> | null> {
    const [author] = await this.db<Author>('authors')
      .insert({ name, description })
      .onConflict()
      .ignore()
      .returning('id');
    return author ?? null;
  }

  async getAuthorWithBooks(
    authorId: number,
    offset: number,
    limit: number,
  ): Promise<{
    author: Author;
    books: Pick<Book, 'id' | 'title' | 'yearCreated'>[];
  }> {
    return await this.db
      .with('paginated_books_cte', (qb) =>
        qb
          .select('b.id', 'b.title', 'b.year_created')
          .from('books as b')
          .joinRaw(
            'inner join book_authors ba on ba.book_id = b.id and ba.author_id = ?',
            authorId,
          )
          .orderBy('b.listed_at', 'desc')
          .offset(offset)
          .limit(limit),
      )
      .first([
        this.db.raw(`json_build_object(
            'id', a.id, 
            'name', a.name,
            'description', a.description
          ) AS author`),
        this.db.raw(`
          (SELECT json_agg(
            json_build_object(
              'id', pb.id,
              'title', pb.title,
              'yearCreated', pb.year_created
            )
          ) FROM paginated_books_cte pb) AS books
        `),
      ])
      .from('authors as a')
      .join('book_authors as ba', 'ba.author_id', 'a.id')
      .join('books as b', 'b.id', 'ba.book_id')
      .where('a.id', authorId)
      .groupBy('a.id', 'a.name');
  }
}
