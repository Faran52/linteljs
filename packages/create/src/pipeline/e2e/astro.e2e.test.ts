import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { casesFor } from './cases';
import { runE2eCase } from './runE2eCase';
import { afterAllCleanup } from './utils/workspaceUtils';

describe('astro end-to-end', () => {
  afterAll(afterAllCleanup);

  it.concurrent.each(casesFor('astro'))('generates, installs and checks $label', runE2eCase, 900_000);
});
