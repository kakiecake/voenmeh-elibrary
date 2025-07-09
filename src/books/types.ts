export type Book = {
  id: number;
  title: string;
  description: string;
  country: string;
  authors: Omit<Author, 'description'>[];
  yearCreated: number;
  isbn?: string;
  listedAt: Date;
  isBookmarked: boolean;
};

export type BookCreateDTO = {
  title: string;
  description: string;
  countryCode: string;
  authorIds: number[];
  yearCreated: number;
  isbn?: string;
  fileData: Buffer;
};

export type Author = {
  id: number;
  name: string;
  description: string;
};

export type DbBook = {
  id: number;
  title: string;
  description: string;
  countryCode: string;
  yearCreated: number;
  isbn?: string;
  listedAt: Date;
  filePath: string;
};

export type BookRepr = Omit<DbBook, 'countryCode' | 'filePath'> & {
  country: string;
  authors: { id: number; name: string }[];
  isBookmarked: boolean;
};

export type Country = { code: string; name: string };
