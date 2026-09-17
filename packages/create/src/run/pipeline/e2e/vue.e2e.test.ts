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

describe('vue end-to-end', () => {
  afterAll(afterAllCleanup);

  it.each(withPackageManagers('vue', { target: 'vue' }))
  ('generates, installs and checks $label', runE2eCase, 900_000);

  // `@tanstack/vue-query` pulls `vue-demi`, whose build script pnpm refuses unless approved.
  it.each(withDefaultPm('vue with every library and pinia', {
    target: 'vue',
    libraries: LIBRARIES,
    form: 'tanstack-form',
    store: true,
  }))
  ('generates, installs and checks $label', runE2eCase, 900_000);
});
