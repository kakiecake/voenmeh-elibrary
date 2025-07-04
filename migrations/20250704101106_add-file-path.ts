import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE books ADD COLUMN file_path varchar(32);`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE books DROP COLUMN file_path;`);
}
