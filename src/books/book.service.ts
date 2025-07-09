import { Inject, Injectable } from '@nestjs/common';
import { Book, BookCreateDTO, Country } from './types';
import { BookRepository } from './book.repository';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';
import { FileStorage, FileStorageSymbol } from './file-storage.interface';

@Injectable()
export class BookService {
  constructor(
    private readonly bookRepository: BookRepository,
    @Inject(FileStorageSymbol) private readonly fileStorage: FileStorage,
  ) {}

  async getBookFile(id: number): Promise<Readable | null> {
    const filePath = await this.bookRepository.getBookFilePath(id);
    if (!filePath) return null;
    return this.fileStorage.readFile(filePath);
  }

  async getBookForUser(
    id: number,
    userId: number | null,
  ): Promise<Book | null> {
    return await this.bookRepository.getBookForUser(id, userId);
  }

  async getBooksWithBookmarks(
    userId: number,
    pagination: { pageIndex: number; pageSize: number },
  ): Promise<Book[]> {
    return await this.bookRepository.getBooksWithBookmarks(
      userId,
      pagination.pageSize * pagination.pageIndex,
      pagination.pageSize,
    );
  }

  async searchBooksForUser(
    query: string,
    userId: number | null,
    pagination: { pageIndex: number; pageSize: number },
  ): Promise<Omit<Book, 'fileData'>[]> {
    return await this.bookRepository.searchBooksForUser(
      query,
      userId,
      pagination.pageSize * pagination.pageIndex,
      pagination.pageSize,
    );
  }

  // TODO: handle errors
  async addBook(
    book: BookCreateDTO,
  ): Promise<Pick<Book, 'id' | 'listedAt'> | Error> {
    const fileName = crypto.randomBytes(24).toString('base64url');
    // WARN: if book creation fails, created files will not be deleted
    const error = await this.fileStorage.writeFile(fileName, book.fileData);
    if (error) return new Error('File cannot be saved');
    return await this.bookRepository.createBook({
      ...book,
      filePath: fileName,
    });
  }

  async getCountries(): Promise<Country[]> {
    return await this.bookRepository.getCountries();
  }

  async toggleBookmark(userId: number, bookId: number): Promise<boolean> {
    return await this.bookRepository.toggleBookmark(userId, bookId);
  }
}
