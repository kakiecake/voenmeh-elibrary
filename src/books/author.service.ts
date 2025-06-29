import { Injectable } from '@nestjs/common';
import { AuthorRepository } from './author.repository';
import { Author } from './types';

@Injectable()
export class AuthorService {
  constructor(private readonly authorRepository: AuthorRepository) {}

  async findAuthors(query: string, excludeIds: number[]): Promise<Author[]> {
    return this.authorRepository.findAuthors(query, excludeIds);
  }
}
