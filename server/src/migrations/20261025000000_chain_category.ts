import type { Knex } from 'knex';

/** Seed category (GENERIC | POLITICAL | SARCASTIC …). Existing chains become GENERIC. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('chains', (t) => {
    t.string('category', 20).notNullable().defaultTo('GENERIC');
    t.index(['modality', 'language', 'category']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('chains', (t) => {
    t.dropIndex(['modality', 'language', 'category']);
    t.dropColumn('category');
  });
}
