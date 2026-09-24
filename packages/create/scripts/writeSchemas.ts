/**
 * Writes the current config schema to both checked-in copies: root `schemas/`, which `CONFIG_SCHEMA_URL` resolves,
 * and `templates/schemas/`, which the package ships. `schemaUtils.test.ts` holds both to `schemaFor(ANSWERS)`.
 * Usage: pnpm --filter @linteljs/create schema
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ANSWERS, CURRENT_SCHEMA_VERSION } from '../src/answers';
import { schemaFor } from '../src/answers/utils/schemaUtils';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const FILE = `linteljs.config.v${String(CURRENT_SCHEMA_VERSION)}.schema.json`;
const schema = schemaFor(ANSWERS);

for (const dir of ['schemas', 'packages/create/templates/schemas']) {
  writeFileSync(join(ROOT, dir, FILE), schema);
}
