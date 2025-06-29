import { Module } from '@nestjs/common';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { BookRepository } from './book.repository';
import { AuthorRepository } from './author.repository';
import { AuthorService } from './author.service';

@Module({
  controllers: [BookController],
  providers: [BookService, BookRepository, AuthorRepository, AuthorService],
})
export class BookModule {}
