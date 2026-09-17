import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { casesFor } from './cases';
import { afterAllCleanup, runE2eCase } from './helpers';

describe('react-native end-to-end', () => {
  afterAll(afterAllCleanup);

  it.concurrent.each(casesFor('react-native'))('generates, installs and checks $label', runE2eCase, 900_000);
});
