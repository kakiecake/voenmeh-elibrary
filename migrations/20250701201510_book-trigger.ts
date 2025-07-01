import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.raw(`
    CREATE OR REPLACE FUNCTION books_search_vec_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vec := 
        setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('russian', (
          select string_agg(a.name, ' ')
          from book_authors ba
          join authors a
          on a.id = ba.author_id
          where ba.book_id = NEW.id
        )), 'B') ||
        setweight(to_tsvector('russian', COALESCE(NEW.description, '')), 'C');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw(`
    CREATE OR REPLACE FUNCTION books_search_vec_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vec := 
        setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('russian', COALESCE(NEW.description, '')), 'B');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
}
