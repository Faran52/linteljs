import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { casesFor } from './cases/cases';
import { runE2eCase } from './run-e2e-case/runE2eCase';
import { afterAllCleanup } from './utils/workspaceUtils';

describe('vue end-to-end', () => {
  afterAll(afterAllCleanup);

  it.concurrent.each(casesFor('vue'))('generates, installs and checks $label', runE2eCase, 900_000);
});
