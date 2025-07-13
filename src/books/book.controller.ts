import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { CreateAuthorDto } from './dto/create-author.dto';
import { GetAuthorCreationFormQuery } from './dto/get-author-creation-form.query';
import { SearchAuthorsQuery } from './dto/search-authors.query';
import { GetBookmarksQuery } from './dto/get-bookmarks.query';
import { GetAuthorQuery } from './dto/get-author.query';

const API_PAGE_SIZE = 10;
const API_AUTHOR_LIMIT = 5;

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
    const books = await this.bookService.searchBooksForUser(
      query.q ?? '',
      user?.id ?? null,
      {
        pageIndex: query.page - 1,
        pageSize: API_PAGE_SIZE,
      },
    );

    const isEnd = books.length < API_PAGE_SIZE;
    res.render(query.partial ? 'partials/book-list' : 'books', {
      title: 'Электронная библиотека',
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

  @Protected({ adminOnly: true })
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
    res.render('book-created', {
      book: { ...body, ...result },
      user,
    });
  }

  @Protected({ adminOnly: true })
  @UseInterceptors(FileInterceptor('bookFile'))
  @Patch('/books/:id')
  async updateBook(
    @Param('id', new ParseIntPipe()) bookId: number,
    @Body() body: CreateBookDto,
    @UserDecorator() user: AuthorizedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    const result = await this.bookService.updateBook(bookId, {
      ...body,
      fileData: file?.buffer,
    });
    if (result instanceof Error) return res.status(500).end();
    res.render('book-created', {
      edited: true,
      book: { id: bookId, ...body },
      user,
    });
  }

  @Protected({ adminOnly: true })
  @Delete('/books/:id')
  async deleteBook(
    @Query('redirect') redirectQuery: string,
    @Param('id', new ParseIntPipe()) bookId: number,
    @Res() res: Response,
  ) {
    const shouldRedirect = !!redirectQuery;
    await this.bookService.deleteBook(bookId);
    res.status(200);
    if (shouldRedirect) res.setHeader('HX-Redirect', '/books');
    res.end();
  }

  @Protected({ adminOnly: true })
  @Get('/books/new')
  async renderNewBookPage(
    @UserDecorator() user: AuthorizedUser,
    @Res() res: Response,
  ) {
    const countries = await this.bookService.getCountries();
    res.render('book-edit', { selectedIds: [], countries, user });
  }

  @Protected({ adminOnly: true })
  @Get('/books/:id/edit')
  async editBooks(
    @Param('id', new ParseIntPipe()) bookId: number,
    @UserDecorator() user: AuthorizedUser,
    @Res() res: Response,
  ) {
    const book = await this.bookService.getBookForUser(bookId, user.id);
    if (!book) return res.render('404');
    const countries = await this.bookService.getCountries();
    res.render('book-edit', {
      selectedIds: [],
      selectedAuthors: book.authors,
      countries,
      user,
      book,
    });
  }

  @Protected({ adminOnly: true })
  @Get('/authors/search')
  async findAuthors(@Query() query: SearchAuthorsQuery, @Res() res: Response) {
    const authors = await this.authorService.findAuthors(
      query.q ?? '',
      query.excludeIds,
      API_AUTHOR_LIMIT,
    );
    res.render('partials/author-list', { query: query.q, authors });
  }

  @Protected({ adminOnly: true })
  @Post('/authors/list')
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

  @Protected({ adminOnly: true })
  @Post('/authors')
  async createNewAuthor(@Body() body: CreateAuthorDto, @Res() res: Response) {
    const author = await this.authorService.createAuthor(
      body.name,
      body.description,
    );
    if (!author)
      return res.render('partials/author-creation-form', {
        error: 'Автор с таким именем уже существует',
        ...body,
      });

    res.render('partials/author-selector', {
      selectedAuthors: [...body.selectedAuthors, author],
    });
  }

  @Protected({ adminOnly: true })
  @Get('/authors/creation-form')
  getAuthorCreationForm(
    @Query() query: GetAuthorCreationFormQuery,
    @Res() res: Response,
  ) {
    res.render('partials/author-creation-form', {
      name: query.query?.trim() ?? '',
      selectedAuthors: query.selectedAuthors,
    });
  }

  @Get('/books/:id')
  async getBookById(
    @Param('id', new ParseIntPipe()) id: number,
    @UserDecorator() user: AuthorizedUser | null,
    @Res() res: Response,
  ) {
    const book = await this.bookService.getBookForUser(id, user?.id ?? null);
    if (!book) return res.render('404', { message: 'Book not found' });
    res.render('book-view', { title: book.title, book, user });
  }

  @Protected()
  @Post('/books/:id/bookmark')
  async toggleBookmark(
    @Param('id', new ParseIntPipe()) bookId: number,
    @UserDecorator() user: AuthorizedUser,
    @Res() res: Response,
  ) {
    const isBookmarked = await this.bookService.toggleBookmark(user.id, bookId);
    res.render('partials/book-list-bookmark-button', {
      id: bookId,
      isBookmarked,
    });
  }

  @Protected()
  @Get('/bookmarks')
  async renderBookmarksPage(
    @Query() query: GetBookmarksQuery,
    @UserDecorator() user: AuthorizedUser,
    @Res() res: Response,
  ) {
    const books = await this.bookService.getBooksWithBookmarks(user.id, {
      pageIndex: query.page - 1,
      pageSize: API_PAGE_SIZE,
    });
    const isEnd = books.length < API_PAGE_SIZE;
    res.render(query.partial ? 'partials/bookmark-list' : 'bookmarks', {
      user,
      books,
      partial: query.partial,
      pagination: {
        page: query.page,
        isEnd,
        nextPage: isEnd ? null : query.page + 1,
      },
    });
  }

  @Get('/authors/:id')
  async renderAuthorPage(
    @Param('id', new ParseIntPipe()) authorId: number,
    @Query() query: GetAuthorQuery,
    @UserDecorator() user: AuthorizedUser | null,
    @Res() res: Response,
  ) {
    const authorWithBooks = await this.authorService.getAuthorWithBooks(
      authorId,
      {
        pageIndex: query.page - 1,
        pageSize: API_PAGE_SIZE,
      },
    );
    const isEnd = authorWithBooks.books.length < API_PAGE_SIZE;
    const pagination = {
      page: query.page,
      nextPage: isEnd ? null : query.page + 1,
      isEnd,
    };
    res.render(query.partial ? 'partials/author-book-list' : 'author', {
      ...authorWithBooks,
      user,
      pagination,
      partial: query.partial,
    });
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
