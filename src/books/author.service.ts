import { Injectable } from '@nestjs/common';
import { AuthorRepository } from './author.repository';
import { Author, Book } from './types';

@Injectable()
export class AuthorService {
  constructor(private readonly authorRepository: AuthorRepository) {}

  async findAuthors(
    query: string,
    excludeIds: number[],
    limit: number,
  ): Promise<Author[]> {
    return await this.authorRepository.findAuthors(query, excludeIds, limit);
  }

  async createAuthor(
    name: string,
    description: string,
  ): Promise<Author | null> {
    const result = await this.authorRepository.createAuthor(name, description);
    return result ? { ...result, name, description } : null;
  }

  async getAuthorWithBooks(
    authorId: number,
    pagination: { pageIndex: number; pageSize: number },
  ): Promise<{
    author: Author;
    books: Pick<Book, 'id' | 'title' | 'yearCreated'>[];
  }> {
    const offset = pagination.pageIndex * pagination.pageSize;
    const limit = pagination.pageSize;

    return await this.authorRepository.getAuthorWithBooks(
      authorId,
      offset,
      limit,
    );
  }
}
