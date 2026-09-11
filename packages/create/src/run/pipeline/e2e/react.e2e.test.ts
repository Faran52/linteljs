import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { LIBRARIES } from '../../../model/answers/answers';

import {
  afterAllCleanup,
  runE2eCase,
  withDefaultPm,
  withPackageManagers,
} from './helpers';

describe('react end-to-end', () => {
  afterAll(afterAllCleanup);

  it.each(withPackageManagers('react', { target: 'react' }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withPackageManagers('react with every library', {
    target: 'react',
    libraries: LIBRARIES,
    store: true,
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('react on the relaxed floor', {
    target: 'react',
    typeSafety: 'relaxed',
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
