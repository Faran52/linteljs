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

describe('vue end-to-end', () => {
  afterAll(afterAllCleanup);

  it.each(withPackageManagers('vue', { target: 'vue' }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
