// Writes each composed template file from its base and option modules; fails when that changed a committed file.
import { join } from 'node:path';
import process from 'node:process';

import { SUBJECTS } from '../../packages/compose/src/shipped/constants.ts';
import { shippedCompose } from '../../packages/compose/src/shipped/shippedCompose.ts';
import { subjectVariants } from '../../packages/compose/src/shipped/utils/variantUtils.ts';
import { log, logError } from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';
import { writeChanged } from '../utils/codegenUtils.ts';

import { SHELLS_DIR } from './constants.ts';
import {
  namesBeside,
  readSource,
  shippedPaths,
} from './utils/treeUtils.ts';

const stale: string[] = [];

const paths = shippedPaths();

for (const subject of SUBJECTS) {
  const sourceNames = namesBeside(subject.base);

  for (const variant of subjectVariants(subject, paths, sourceNames)) {
    const path = join(SHELLS_DIR, variant.shipped);
    const text = shippedCompose(subject, variant, readSource);

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
