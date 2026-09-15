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

  // One form library at a time: `react-hook-form` gets its own case below.
  it.each(withPackageManagers('react with every library', {
    target: 'react',
    libraries: LIBRARIES.filter((library) => {
      return library !== 'react-hook-form';
    }),
    store: true,
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('react with react-hook-form and zod', {
    target: 'react',
    libraries: ['zod', 'react-hook-form'],
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('react with react-router', {
    target: 'react',
    router: 'react-router',
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('react with tanstack router', {
    target: 'react',
    router: 'tanstack-router',
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('react on the relaxed floor', {
    target: 'react',
    typeSafety: 'relaxed',
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
