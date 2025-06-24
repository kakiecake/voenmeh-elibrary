import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { DbSymbol } from '../global.constants';
import { BookRepr, DbBook } from './types';

@Injectable()
export class BookRepository {
  constructor(@Inject(DbSymbol) private readonly db: Knex) {}

  private selectBooks = <T = any>() =>
    this.db('books AS b')
      .select<T>(
        'b.id',
        'b.title',
        'b.description',
        'c.name AS country',
        'b.year_created AS yearCreated',
        'b.isbn',
        'b.listed_at AS listedAt',
      )
      .join('countries AS c', 'c.code', '=', 'b.country_code');

  async getBookById(id: DbBook['id']): Promise<BookRepr | null> {
    const [book] = await this.selectBooks<[BookRepr]>().where({ id });
    return book || null;
  }

  async searchBooks(query: string): Promise<BookRepr[]> {
    return await this.selectBooks<BookRepr[]>().whereRaw(
      'search_vec @@ websearch_to_tsquery(?)',
      query,
    );
  }

  async createBook(
    book: Omit<DbBook, 'id' | 'listedAt'>,
  ): Promise<Pick<DbBook, 'id' | 'listedAt'>> {
    return await this.db('books')
      .insert({
        title: book.title,
        description: book.description,
        country_code: book.countryCode,
        year_created: book.yearCreated,
        isbn: book.isbn,
      })
      .returning('id, listed_at AS "listedAt"');
  }
}
