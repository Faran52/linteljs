// Writes each tree's css markup from the shared markup and the class maps; fails when that changed a committed file.
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';

import { log, logError } from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';
import { writeChanged } from '../utils/codegenUtils.ts';

import { TARGETS, TEMPLATES_DIR } from './constants.ts';
import { cssPathOf, markupText } from './utils/cssMarkupUtils.ts';

const stale: string[] = [];

for (const target of TARGETS) {
  for (const file of target.files) {
    const source = join(TEMPLATES_DIR, target.root, file.markup);
    const path = join(TEMPLATES_DIR, target.root, cssPathOf(file.markup));

    mkdirSync(dirname(path), { recursive: true });

    const shared = readFileSync(source, 'utf8');
    const text = markupText(shared, source, file, target.attribute);

    if (writeChanged(path, text)) {
      stale.push(path);
    }
  }
}

if (stale.length === 0) {
  log('every css markup file is current');
}
else {
  logError(`stale and rewritten, commit them:\n${stale.join('\n')}`);
  process.exitCode = 1;
}
