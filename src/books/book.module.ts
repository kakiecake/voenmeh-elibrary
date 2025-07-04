import { Module } from '@nestjs/common';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { BookRepository } from './book.repository';
import { AuthorRepository } from './author.repository';
import { AuthorService } from './author.service';
import { FileStorageSymbol } from './file-storage.interface';
import { FsFileStorage } from './fs-file-storage.service';

@Module({
  controllers: [BookController],
  providers: [
    BookService,
    BookRepository,
    AuthorRepository,
    AuthorService,
    { provide: FileStorageSymbol, useClass: FsFileStorage },
  ],
})
export class BookModule {}
