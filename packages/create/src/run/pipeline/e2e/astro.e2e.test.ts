import {
  afterAll,
  describe,
  it,
} from 'vitest';

import {
  afterAllCleanup,
  runE2eCase,
  withDefaultPm,
  withPackageManagers,
} from './helpers';

describe('astro end-to-end', () => {
  afterAll(afterAllCleanup);

  it.each(withPackageManagers('astro', { target: 'astro' }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('astro hosting solid', {
    target: 'astro',
    hostedFramework: 'solid',
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('astro hosting vue', {
    target: 'astro',
    hostedFramework: 'vue',
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
