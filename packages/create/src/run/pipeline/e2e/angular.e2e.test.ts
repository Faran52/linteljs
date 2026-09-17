import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { casesFor } from './cases';
import { afterAllCleanup, runE2eCase } from './helpers';

describe('angular end-to-end', () => {
  afterAll(afterAllCleanup);

  it.concurrent.each(casesFor('angular'))('generates, installs and checks $label', runE2eCase, 900_000);
});
