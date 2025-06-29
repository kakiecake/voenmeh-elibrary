import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.raw(`
    CREATE TABLE users (
      id serial primary key,
      role int not null default 1,
      email varchar(32) unique not null,
      password_hash text not null,
      created_at timestamptz default now()
    );

    CREATE TABLE authors (
      id serial PRIMARY KEY,
      name varchar(50) NOT NULL,
      description text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    
    CREATE TABLE countries (
      code char(2) PRIMARY KEY,
      name varchar(40)
    );
    
    CREATE TABLE books (
      id serial PRIMARY KEY,
      title varchar(80) NOT NULL,
      description text NOT NULL,
      country_code char(2) REFERENCES countries(code) NOT NULL,
      isbn varchar(13),
      year_created int NOT NULL,
      listed_at timestamptz NOT NULL DEFAULT now(),
      search_vec tsvector
    );

    CREATE OR REPLACE FUNCTION books_search_vec_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vec := 
        setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('russian', COALESCE(NEW.description, '')), 'B');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER books_search_vec_trigger
    BEFORE INSERT OR UPDATE OF title, description ON books
    FOR EACH ROW EXECUTE FUNCTION books_search_vec_update();

    CREATE TABLE book_authors (
      book_id int REFERENCES books(id) ON DELETE CASCADE,
      author_id int REFERENCES authors(id) ON DELETE CASCADE,
      PRIMARY KEY (book_id, author_id)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS books_search_vec_trigger ON books;
    DROP FUNCTION IF EXISTS books_search_vec_update;

    DROP TABLE IF EXISTS book_authors;
    DROP TABLE IF EXISTS books;
    DROP TABLE IF EXISTS countries;
    DROP TABLE IF EXISTS authors;
    DROP TABLE IF EXISTS users;
  `);
}
