import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { BookService } from './book.service';
import { Response } from 'express';

@Controller('/')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get('/books')
  async getBooksPage(
    @Query('q') query: string | undefined,
    @Res() res: Response,
  ) {
    const books = await this.bookService.findBooks(query ?? '');
    res.render('books', { query, books });
  }

  @Get('/books/:id')
  async getBookById(
    @Param('id', new ParseIntPipe()) id: number,
    @Res() res: Response,
  ) {
    const book = await this.bookService.getBookById(id);
    if (!book) return res.render('404', { message: 'Book not found' });
    res.render('book-view', book);
  }
}
