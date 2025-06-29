export type Book = {
  id: number;
  title: string;
  description: string;
  country: string;
  authors: Author[];
  yearCreated: number;
  isbn?: string;
  listedAt: Date;
};

export type BookCreateDTO = {
  title: string;
  description: string;
  countryCode: string;
  authorIds: number[];
  yearCreated: number;
  isbn?: string;
};

export type Author = {
  id: number;
  name: string;
};

export type DbBook = {
  id: number;
  title: string;
  description: string;
  countryCode: string;
  yearCreated: number;
  isbn?: string;
  listedAt: Date;
};

export type BookRepr = Omit<DbBook, 'countryCode'> & {
  country: string;
  authors: { id: number; name: string }[];
};
