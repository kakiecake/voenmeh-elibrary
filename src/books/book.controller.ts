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
  UnprocessableEntityException,
} from '@nestjs/common';
import { BookService } from './book.service';
import { Response } from 'express';
import { AuthorService } from './author.service';
import { CreateBookDto } from './dto/create-book.dto';
import { AuthorizedUser, UserDecorator } from '../users/user.decorator';
import { SearchBooksQueryDto } from './dto/search-books.query';

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
    @UserDecorator() user: AuthorizedUser | undefined,
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

  @Post('/books')
  async createBook(@Body() body: CreateBookDto, @Res() res: Response) {
    await this.bookService.addBook(body);
    res.render('book-created', { title: body.title });
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
  addAuthorToList(@Body() body: unknown, @Res() res: Response) {
    const parsedBody = this.validateAndParse(body);
    if (!parsedBody)
      throw new UnprocessableEntityException('Invalid body format');

    const authors = [
      ...parsedBody.authors.filter((a) => a.id !== parsedBody.newAuthor.id),
      parsedBody.newAuthor,
    ];

    res.render('partials/author-selector', {
      selectedIds: authors.map((a) => a.id),
      selectedAuthors: authors,
    });
  }

  private validateAndParse(input: unknown): {
    authors: { id: string; name: string }[];
    newAuthor: { id: string; name: string };
  } | null {
    if (
      !input ||
      typeof input !== 'object' ||
      !('newAuthor' in input) ||
      !input.newAuthor ||
      typeof (input.newAuthor as { id?: unknown }).id !== 'string' ||
      typeof (input.newAuthor as { name?: unknown }).name !== 'string'
    ) {
      return null;
    }

    const typedInput = input as {
      id?: unknown;
      name?: unknown;
      newAuthor: { id: string; name: string };
    };

    const idType = typeof typedInput.id;
    const nameType = typeof typedInput.name;
    const idIsArray = Array.isArray(typedInput.id);
    const nameIsArray = Array.isArray(typedInput.name);

    if (
      (idType !== 'undefined' || nameType !== 'undefined') &&
      idType !== nameType
    ) {
      return null;
    }

    if (
      idIsArray &&
      nameIsArray &&
      (typedInput.id as unknown[]).length !==
        (typedInput.name as unknown[]).length
    ) {
      return null;
    }

    const authors: { id: string; name: string }[] = [];

    if (idType === 'string') {
      authors.push({
        id: typedInput.id as string,
        name: typedInput.name as string,
      });
    } else if (idIsArray) {
      for (let i = 0; i < (typedInput.id as unknown[]).length; i += 1) {
        if (
          typeof (typedInput.id as unknown[])[i] !== 'string' ||
          typeof (typedInput.name as unknown[])[i] !== 'string'
        ) {
          return null;
        }
        authors.push({
          id: (typedInput.id as string[])[i],
          name: (typedInput.name as string[])[i],
        });
      }
    }

    return {
      authors,
      newAuthor: typedInput.newAuthor,
    };
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
