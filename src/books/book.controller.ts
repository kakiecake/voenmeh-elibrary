import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Redirect,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BookService } from './book.service';
import { Response } from 'express';
import { AuthorService } from './author.service';
import { CreateBookDto } from './dto/create-book.dto';
import { AuthorizedUser, UserDecorator } from '../users/user.decorator';
import { SearchBooksQueryDto } from './dto/search-books.query';
import { FileInterceptor } from '@nestjs/platform-express';
import stream from 'node:stream';
import { Protected } from '../users/auth.decorator';
import { AddAuthorToListDto } from './dto/add-author-to-list.dto';

const API_PAGE_SIZE = 5;

@Controller('/')
export class BookController {
  constructor(
    private readonly bookService: BookService,
    private readonly authorService: AuthorService,
  ) {}

  @Redirect('/books')
  @Get('/')
  indexPage() {}

  @Get('/books')
  async searchBooks(
    @UserDecorator() user: AuthorizedUser | null,
    @Query() query: SearchBooksQueryDto,
    @Res() res: Response,
  ) {
    const books = await this.bookService.findBooks(query.q ?? '', {
      pageIndex: query.page - 1,
      pageSize: API_PAGE_SIZE,
    });

    const isEnd = books.length < API_PAGE_SIZE;
    res.render(query.partial ? 'partials/book-list' : 'books', {
      query: query.q,
      books,
      user,
      partial: query.partial,
      pagination: {
        page: query.page,
        isEnd,
        nextPage: isEnd ? null : query.page + 1,
      },
    });
  }

  @Protected
  @UseInterceptors(FileInterceptor('bookFile'))
  @Post('/books')
  async createBook(
    @Body() body: CreateBookDto,
    @UserDecorator() user: AuthorizedUser,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const result = await this.bookService.addBook({
      ...body,
      fileData: file.buffer,
    });
    if (result instanceof Error) return res.status(500).end();
    res.render('book-created', { ...result, user });
  }

  @Get('/admin')
  editBooks(@Res() res: Response) {
    res.render('book-edit', { selectedIds: [] });
  }

  @Get('/authors/search')
  async findAuthors(
    @Query('q') query: string | undefined,
    @Query('excludeIds') excludeIdsRaw: string | string[] | undefined,
    @Res() res: Response,
  ) {
    const excludeIds = excludeIdsRaw
      ? (Array.isArray(excludeIdsRaw)
          ? excludeIdsRaw.map((x) => parseInt(x))
          : [parseInt(excludeIdsRaw)]
        ).filter((x) => !Number.isNaN(x))
      : [];
    const authors = await this.authorService.findAuthors(
      query ?? '',
      excludeIds,
    );
    res.render('partials/author-list', { authors });
  }

  @Post('/authors')
  addAuthorToList(@Body() body: AddAuthorToListDto, @Res() res: Response) {
    const authors = [
      ...body.authors.filter((a) => a.id !== body.newAuthor.id),
      body.newAuthor,
    ];

    res.render('partials/author-selector', {
      selectedIds: authors.map((a) => a.id),
      selectedAuthors: authors,
    });
  }

  @Get('/books/:id')
  async getBookById(
    @Param('id', new ParseIntPipe()) id: number,
    @UserDecorator() user: AuthorizedUser | null,
    @Res() res: Response,
  ) {
    const book = await this.bookService.getBookById(id);
    if (!book) return res.render('404', { message: 'Book not found' });
    res.render('book-view', { book, user });
  }

  @Get('/books/:id/download')
  async downloadBookFile(
    @Param('id', new ParseIntPipe()) id: number,
    @Res() res: Response,
  ) {
    const file = await this.bookService.getBookFile(id);
    if (!file) return res.status(404).end();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="book.pdf"`);

    stream.promises.pipeline(file, res).catch(() => res.end());
  }
}
