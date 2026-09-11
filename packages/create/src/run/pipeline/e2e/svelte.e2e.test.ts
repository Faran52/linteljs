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

describe('svelte end-to-end', () => {
  afterAll(afterAllCleanup);

  it.each(withPackageManagers('svelte', { target: 'svelte' }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
