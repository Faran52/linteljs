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

describe('webextension end-to-end', () => {
  afterAll(afterAllCleanup);

  it.each(withPackageManagers('webextension', { target: 'webextension' }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('webextension with no tests', {
    target: 'webextension',
    testing: 'none',
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  // The React host composes the compiler wiring, so every package `vite.config.ts` imports has to be installed.
  it.each(withDefaultPm('webextension hosting react', {
    target: 'webextension',
    hostedFramework: 'react',
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('webextension on firefox hosting solid', {
    target: 'webextension',
    browser: 'firefox',
    hostedFramework: 'solid',
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  it.each(withDefaultPm('webextension devtools panel on firefox hosting solid', {
    target: 'webextension',
    browser: 'firefox',
    hostedFramework: 'solid',
    surfaces: ['devtools-panel'],
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
