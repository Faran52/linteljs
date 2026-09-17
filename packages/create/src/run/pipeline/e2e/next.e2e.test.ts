import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { casesFor } from './cases';
import { afterAllCleanup, runE2eCase } from './helpers';

describe('next end-to-end', () => {
  afterAll(afterAllCleanup);

  it.concurrent.each(casesFor('next'))('generates, installs and checks $label', runE2eCase, 900_000);
});
