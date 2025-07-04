import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_book_search_vec()
    RETURNS TRIGGER AS $$
    DECLARE
        target_book_id BIGINT;
    BEGIN
        -- Determine which book is affected
        IF TG_TABLE_NAME = 'book_authors' THEN
            target_book_id := COALESCE(NEW.book_id, OLD.book_id);
        ELSE
            target_book_id := NEW.id;
        END IF;

        -- Update the book's search vector
        UPDATE books
        SET search_vec = 
            setweight(to_tsvector('russian', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('russian', (
                SELECT COALESCE(string_agg(a.name, ' '), '')
                FROM book_authors ba
                JOIN authors a ON a.id = ba.author_id
                WHERE ba.book_id = target_book_id
            )), 'B') ||
            setweight(to_tsvector('russian', COALESCE(description, '')), 'C')
        WHERE id = target_book_id;
        
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE CONSTRAINT TRIGGER book_authors_search_vec_trigger
    AFTER INSERT OR UPDATE OR DELETE ON book_authors
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION update_book_search_vec();

    DROP TRIGGER IF EXISTS books_search_vec_trigger ON books;

    CREATE CONSTRAINT TRIGGER books_search_vec_trigger
    AFTER INSERT OR UPDATE OF title, description ON books
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION update_book_search_vec();
  `);
}

export async function down(knex: Knex): Promise<void> {}
