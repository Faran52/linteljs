import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { LIBRARIES } from '../../../model/answers/answers';

import {
  afterAllCleanup,
  runE2eCase,
  withPackageManagers,
} from './helpers';

describe('next end-to-end', () => {
  afterAll(afterAllCleanup);

  it.each(withPackageManagers('next', { target: 'next' }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withPackageManagers('next with every library', {
    target: 'next',
    libraries: LIBRARIES.filter((library) => {
      return library !== 'react-hook-form';
    }),
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
