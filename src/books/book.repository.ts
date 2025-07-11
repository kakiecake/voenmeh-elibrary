import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { DbSymbol } from '../global.constants';
import { BookRepr, Country, DbBook } from './types';

@Injectable()
export class BookRepository {
  constructor(@Inject(DbSymbol) private readonly db: Knex) {}

  async getBookForUser(
    id: DbBook['id'],
    userId: number | null,
  ): Promise<BookRepr | null> {
    const [book] = await this.db('books AS b')
      .select<BookRepr[]>(
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
        this.db.raw(`(bm.book_id is not null) AS "isBookmarked"`),
        'b.year_created AS yearCreated',
        'b.isbn',
        'b.listed_at AS listedAt',
      )
      .where('b.id', '=', id)
      .join('countries AS c', 'c.code', '=', 'b.country_code')
      .leftJoin('book_authors AS ba', 'b.id', '=', 'ba.book_id')
      .leftJoin('authors AS a', 'ba.author_id', '=', 'a.id')
      .leftJoin(
        'bookmarks AS bm',
        this.db.raw('bm.book_id = b.id and bm.user_id = ?', userId),
      )
      .groupByRaw(
        'b.id, b.title, b.description, b.isbn, b.year_created, b.listed_at, bm.book_id, c.name',
      );

    return book ?? null;
  }

  async getBookFilePath(id: DbBook['id']): Promise<DbBook['filePath'] | null> {
    const rows = await this.db('books')
      .select<Pick<DbBook, 'filePath'>[]>('file_path AS filePath')
      .where('id', id);
    return rows.length > 0 ? rows[0].filePath : null;
  }

  async getBooksWithBookmarks(
    userId: number,
    offset: number,
    limit: number,
  ): Promise<BookRepr[]> {
    const books = await this.db('books AS b')
      .select<BookRepr[]>(
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
        this.db.raw(`(bm.book_id is not null) AS "isBookmarked"`),
        'b.year_created AS yearCreated',
        'b.isbn',
        'b.listed_at AS listedAt',
      )
      .join('countries AS c', 'c.code', '=', 'b.country_code')
      .leftJoin('book_authors AS ba', 'b.id', '=', 'ba.book_id')
      .leftJoin('authors AS a', 'ba.author_id', '=', 'a.id')
      .innerJoin(
        'bookmarks AS bm',
        this.db.raw('bm.book_id = b.id and bm.user_id = ?', userId),
      )
      .groupByRaw(
        'b.id, b.title, b.description, b.isbn, b.year_created, b.listed_at, bm.book_id, c.name',
      )
      .orderByRaw('b.listed_at desc, b.id desc')
      .limit(limit)
      .offset(offset);
    return books;
  }

  async searchBooksForUser(
    query: string,
    userId: number | null,
    offset: number,
    limit: number,
  ): Promise<BookRepr[]> {
    let qb = this.db('books AS b')
      .select<BookRepr[]>(
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
        this.db.raw(`(bm.book_id is not null) AS "isBookmarked"`),
        'b.year_created AS yearCreated',
        'b.isbn',
        'b.listed_at AS listedAt',
      )
      .innerJoin('countries AS c', 'c.code', '=', 'b.country_code')
      .leftJoin('book_authors AS ba', 'b.id', '=', 'ba.book_id')
      .leftJoin('authors AS a', 'ba.author_id', '=', 'a.id')
      .leftJoin(
        'bookmarks AS bm',
        this.db.raw('bm.book_id = b.id and bm.user_id = ?', userId),
      )
      .groupByRaw(
        'b.id, b.title, b.description, b.isbn, b.year_created, b.listed_at, bm.book_id, c.name',
      )
      .limit(limit)
      .offset(offset)
      .orderByRaw('b.listed_at desc, b.id desc');

    if (query)
      qb = qb.whereRaw(
        "search_vec @@ websearch_to_tsquery('russian', ?)",
        query,
      );

    return await qb;
  }

  // TODO: prettify the SQL and potentyally omit the transaction
  async updateBook(
    book: Pick<DbBook, 'id'> &
      Partial<Omit<DbBook, 'id' | 'listedAt'> & { authorIds: number[] }>,
  ): Promise<void> {
    await this.db.transaction(async (trx) => {
      // Update book fields if any are provided
      const bookUpdateData = {
        title: book.title,
        description: book.description,
        year_created: book.yearCreated,
        country_code: book.countryCode,
        filePath: book.filePath,
      };

      const cleanBookUpdate = Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.entries(bookUpdateData).filter(([_, v]) => v !== undefined),
      );

      if (Object.keys(cleanBookUpdate).length > 0) {
        await trx('books').where({ id: book.id }).update(cleanBookUpdate);
      }

      if (book.authorIds) {
        await trx('book_authors').where({ book_id: book.id }).delete();

        if (book.authorIds.length > 0) {
          await trx('book_authors').insert(
            book.authorIds.map((authorId) => ({
              book_id: book.id,
              author_id: authorId,
            })),
          );
        }
      }
    });
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

  async toggleBookmark(userId: number, bookId: number): Promise<boolean> {
    const insertResult = await this.db.raw<{ rowCount: number }>(
      `with deletion_cte as (
        delete from bookmarks
        where 
          book_id = :bookId 
          and user_id = :userId
        returning user_id, book_id
      )
      insert into bookmarks (user_id, book_id)
      select :userId, :bookId
      where not exists (select 1 from deletion_cte)
      on conflict do nothing;
    `,
      { userId, bookId },
    );
    return insertResult.rowCount > 0;
  }

  async deleteBook(id: number): Promise<void> {
    await this.db('books').delete().where('id', '=', id);
  }
}
