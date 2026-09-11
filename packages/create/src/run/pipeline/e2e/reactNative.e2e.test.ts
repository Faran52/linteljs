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

describe('react-native end-to-end', () => {
  afterAll(afterAllCleanup);

  it.each(withPackageManagers('react-native', { target: 'react-native' }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
