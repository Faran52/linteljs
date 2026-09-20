import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import { casesFor } from '../matrix/matrix';
import { runE2eCase } from '../runner/runner';
import { afterAllCleanup } from '../utils/workspaceUtils';

describe.each(valuesOf(ANSWERS.target.values))('%s end-to-end', (target) => {
  afterAll(afterAllCleanup);

  it.concurrent.each(casesFor(target))('generates, installs and checks $label', runE2eCase, 900_000);
});
