import { Inject, Injectable } from '@nestjs/common';
import { Book, BookCreateDTO } from './types';
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

  async getBookById(id: number): Promise<Book | null> {
    return await this.bookRepository.getBookById(id);
  }

  async findBooks(
    query: string,
    pagination: { pageIndex: number; pageSize: number },
  ): Promise<Omit<Book, 'fileData'>[]> {
    return await this.bookRepository.searchBooks(
      query,
      pagination.pageSize * pagination.pageIndex,
      pagination.pageSize,
    );
  }

  // TODO: handle errors
  async addBook(book: BookCreateDTO) {
    const fileName = crypto.randomBytes(24).toString('base64url');
    const error = await this.fileStorage.writeFile(fileName, book.fileData);
    if (error) return new Error('File cannot be saved');
    await this.bookRepository.createBook({ ...book, filePath: fileName });
  }
}
