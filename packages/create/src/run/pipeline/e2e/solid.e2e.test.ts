import {
  afterAll,
  describe,
  it,
} from 'vitest';

import {
  afterAllCleanup,
  runE2eCase,
  withPackageManagers,
} from './helpers';

describe('solid end-to-end', () => {
  afterAll(afterAllCleanup);

  it.each(withPackageManagers('solid', { target: 'solid' }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
