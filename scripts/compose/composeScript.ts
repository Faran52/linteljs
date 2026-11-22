// Writes each composed template file from its base and option modules; fails when that changed a committed file.
import { join } from 'node:path';
import process from 'node:process';

import { log, logError } from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';
import { writeChanged } from '../utils/codegenUtils.ts';

import {
  SHELLS_DIR,
  SOURCES_DIR,
  SUBJECTS,
} from './constants.ts';
import { composedText } from './utils/composeUtils.ts';
import { subjectVariants } from './utils/subjectUtils.ts';

const stale: string[] = [];

for (const subject of SUBJECTS) {
  for (const variant of subjectVariants(subject, SHELLS_DIR, SOURCES_DIR)) {
    const path = join(SHELLS_DIR, variant.shipped);
    const text = composedText(subject, variant, SOURCES_DIR);

    if (writeChanged(path, text)) {
      stale.push(path);
    }
  }
}

if (stale.length === 0) {
  log('every composed file is current');
}
else {
  logError(`stale and rewritten, commit them:\n${stale.join('\n')}`);
  process.exitCode = 1;
}
