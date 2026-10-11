// Writes each tree's tailwind `X.styles.ts` from the shared tables, and fails when that changed a committed file.
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { log, logError } from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';

import { TARGETS, TEMPLATES_DIR } from './constants.ts';
import { stylesText } from './utils/tailwindStylesUtils.ts';

const stale: string[] = [];

for (const target of TARGETS) {
  for (const file of target.files) {
    const path = join(TEMPLATES_DIR, target.root, file.path);
    const text = stylesText(file, target.attribute);
    const previous = existsSync(path) ? readFileSync(path, 'utf8') : undefined;

    writeFileSync(path, text);

    if (text !== previous) {
      stale.push(path);
    }
  }
}

if (stale.length === 0) {
  log('every tailwind X.styles.ts is current');
}
else {
  logError(`stale and rewritten, commit them:\n${stale.join('\n')}`);
  process.exitCode = 1;
}
