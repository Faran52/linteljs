/**
 * Regenerates the v2 config schema from `ANSWERS` and writes it to both checked-in copies: the root `schemas/`
 * one the raw GitHub URL in `CONFIG_SCHEMA_URL` resolves, and the `assets/schemas/` one the published package
 * carries alongside it. `schemaUtils.test.ts` pins both against `schemaFor(ANSWERS)`; this is what keeps them
 * equal to it after a record changes.
 *
 *   pnpm --filter @linteljs/create schema
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ANSWERS } from '../src/answers';
import { schemaFor } from '../src/answers/utils/schemaUtils';

const ROOT = join(import.meta.dirname, '..', '..', '..');

const schema = schemaFor(ANSWERS);

for (const target of [
  join(ROOT, 'schemas', 'linteljs.config.v2.schema.json'),
  join(ROOT, 'packages', 'create', 'assets', 'schemas', 'linteljs.config.v2.schema.json'),
]) {
  writeFileSync(target, schema);
}
