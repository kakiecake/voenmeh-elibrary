import { Injectable } from '@nestjs/common';
import { Book, BookCreateDTO } from './types';
import { BookRepository } from './book.repository';

@Injectable()
export class BookService {
  constructor(private readonly bookRepository: BookRepository) {}

  async getBookById(id: number): Promise<Book | null> {
    return await this.bookRepository.getBookById(id);
  }

  async findBooks(
    query: string,
    pagination: { pageIndex: number; pageSize: number },
  ): Promise<Book[]> {
    return await this.bookRepository.searchBooks(
      query,
      pagination.pageSize * pagination.pageIndex,
      pagination.pageSize,
    );
  }

  async addBook(book: BookCreateDTO) {
    return await this.bookRepository.createBook(book);
  }
}
