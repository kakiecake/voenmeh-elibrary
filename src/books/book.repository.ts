import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { DbSymbol } from '../global.constants';
import { BookRepr, Country, DbBook } from './types';

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
        this.db.raw(`coalesce(
          json_agg(
            json_build_object('id', a.id, 'name', a.name)
          ) filter (where a.id is not null),
          null
        ) AS authors`),
        'b.year_created AS yearCreated',
        'b.isbn',
        'b.listed_at AS listedAt',
      )
      .join('countries AS c', 'c.code', '=', 'b.country_code')
      .leftJoin('book_authors AS ba', 'b.id', '=', 'ba.book_id')
      .leftJoin('authors AS a', 'ba.author_id', '=', 'a.id')
      .groupByRaw(
        'b.id, b.title, b.description, b.isbn, b.year_created, b.listed_at, c.name',
      );

  async getBookById(id: DbBook['id']): Promise<BookRepr | null> {
    const [book] = await this.selectBooks<[BookRepr]>().where('b.id', '=', id);
    return book || null;
  }

  async getBookFilePath(id: DbBook['id']): Promise<DbBook['filePath'] | null> {
    const rows = await this.db('books')
      .select<Pick<DbBook, 'filePath'>[]>('file_path AS filePath')
      .where('id', id);
    return rows.length > 0 ? rows[0].filePath : null;
  }

  async searchBooks(
    query: string,
    offset: number,
    limit: number,
  ): Promise<BookRepr[]> {
    let qb = this.selectBooks<BookRepr[]>()
      .limit(limit)
      .offset(offset)
      .orderBy('listed_at', 'desc');

    if (query)
      qb = qb.whereRaw(
        "search_vec @@ websearch_to_tsquery('russian', ?)",
        query,
      );

    return await qb;
  }

  async createBook(
    book: Omit<DbBook, 'id' | 'listedAt'> & { authorIds: number[] },
  ): Promise<Pick<DbBook, 'id' | 'listedAt'>> {
    return await this.db.raw(
      `with insert_books_cte as (
        insert into books
          (title, description, year_created, country_code, file_path)
        values
          (:title, :description, :yearCreated, :countryCode, :filePath)
        returning id, listed_at
      ), insert_book_authors_cte as (
        insert into book_authors (book_id, author_id)
        select 
          id, 
          unnest(
            array[${book.authorIds.map((_, i) => `:${i}::int`).join(', ')}]::int[]
          )
        from insert_books_cte
      )
      select id, listed_at AS "listedAt" from insert_books_cte`,
      {
        title: book.title,
        description: book.description,
        yearCreated: book.yearCreated,
        countryCode: book.countryCode,
        filePath: book.filePath,
        ...book.authorIds,
      },
    );
  }

  getCountries(): Promise<Country[]> {
    return this.db('countries').select('code', 'name');
  }
}
