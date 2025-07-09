import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    create table bookmarks (
      user_id int references users(id),
      book_id int references books(id),
      created_at timestamptz default NOW(),
      primary key (user_id, book_id)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    drop table bookmarks;
  `);
}
