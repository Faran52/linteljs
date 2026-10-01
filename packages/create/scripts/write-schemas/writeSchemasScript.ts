import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { schemaFor } from '@answers/utils/schemaUtils';

import { ANSWERS, CURRENT_SCHEMA_VERSION } from '../../src/answers';

const ROOT = join(import.meta.dirname, '../../../..');
const FILE = `linteljs.config.v${String(CURRENT_SCHEMA_VERSION)}.schema.json`;
const schema = schemaFor(ANSWERS);

for (const dir of ['schemas', 'packages/create/templates/schemas']) {
  writeFileSync(join(ROOT, dir, FILE), schema);
}
