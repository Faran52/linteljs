// The CJS half cannot be `.cjs`: ESLint 5's config loader sends that extension to its YAML branch.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { log } from '../../../../create/templates/project/scripts/utils/loggerUtils.ts';

const manifest = join(import.meta.dirname, '../../../dist/package.json');

writeFileSync(manifest, `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);

log('dist/package.json marks the bundle CommonJS');
