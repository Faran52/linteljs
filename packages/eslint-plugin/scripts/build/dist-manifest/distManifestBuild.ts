/**
 * Marks `dist/` CommonJS, so `dist/index.js` reads as CJS under this package's `"type": "module"`. The CJS half
 * cannot be `.cjs`: ESLint 5's config loader sends that extension to its YAML branch, which `release/compat-matrix/`
 * proves. Run from `build`, so a plain `tsdown` never leaves `dist/` half-configured.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { log } from '../../../../create/templates/project/scripts/utils/loggerUtils.ts';

const manifest = join(import.meta.dirname, '../../../dist/package.json');

writeFileSync(manifest, `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);

log('dist/package.json marks the bundle CommonJS');
