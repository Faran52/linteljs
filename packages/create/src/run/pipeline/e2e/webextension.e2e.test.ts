import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { casesFor } from './cases';
import { afterAllCleanup, runE2eCase } from './helpers';

describe('webextension end-to-end', () => {
  afterAll(afterAllCleanup);

  it.concurrent.each(casesFor('webextension'))('generates, installs and checks $label', runE2eCase, 900_000);
});
