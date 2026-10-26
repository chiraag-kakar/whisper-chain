import type { Knex } from 'knex';
import crypto from 'node:crypto';

/**
 * Production's participants table predates the current init migration (it was
 * created by an earlier build), so some columns are missing. Add whatever this
 * code needs, give every row a resume code, and relax NOT NULL on legacy columns
 * the app no longer writes so new participants can be inserted. Nothing is dropped.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function resumeCode(): string {
  const bytes = crypto.randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

const COLUMNS: Record<string, (t: Knex.AlterTableBuilder, knex: Knex) => void> = {
  google_sub: (t) => t.string('google_sub', 64).nullable(),
  email: (t) => t.string('email', 255).nullable(),
  name: (t) => t.string('name', 200).nullable(),
  gender: (t) => t.string('gender', 40).nullable(),
  study_level: (t) => t.string('study_level', 80).nullable(),
  consent_audio: (t) => t.boolean('consent_audio').notNullable().defaultTo(false),
  consent_text: (t) => t.boolean('consent_text').notNullable().defaultTo(false),
  consented_at: (t) => t.timestamp('consented_at', { useTz: true }).nullable(),
  resume_code: (t) => t.string('resume_code', 16).nullable(),
  preferred_language: (t) => t.string('preferred_language', 8).nullable(),
  created_at: (t, knex) => t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now()),
  last_seen_at: (t, knex) => t.timestamp('last_seen_at', { useTz: true }).notNullable().defaultTo(knex.fn.now()),
};

export async function up(knex: Knex): Promise<void> {
  const info = await knex('participants').columnInfo();
  console.log('[db] participants columns before reconcile:', Object.keys(info).join(', '));

  const missing = Object.keys(COLUMNS).filter((c) => !(c in info));
  if (missing.length) {
    await knex.schema.alterTable('participants', (t) => {
      for (const c of missing) COLUMNS[c](t, knex);
    });
    console.log('[db] participants: added', missing.join(', '));
  }

  const needCodes = await knex('participants').select('id').whereNull('resume_code').orWhere('resume_code', '');
  for (const { id } of needCodes) await knex('participants').where({ id }).update({ resume_code: resumeCode() });
  await knex.raw('ALTER TABLE participants ALTER COLUMN resume_code SET NOT NULL');
  await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS participants_resume_code_unique ON participants (resume_code)');
  await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS participants_google_sub_unique ON participants (google_sub)');

  const legacy = Object.entries(info).filter(([c, i]) => c !== 'id' && !(c in COLUMNS) && !i.nullable && i.defaultValue === null);
  for (const [c] of legacy) await knex.raw('ALTER TABLE participants ALTER COLUMN ?? DROP NOT NULL', [c]);
  if (legacy.length) console.log('[db] participants: made nullable', legacy.map(([c]) => c).join(', '));
}

export async function down(): Promise<void> {
  // Additive repair of a legacy table; nothing to undo safely.
}
