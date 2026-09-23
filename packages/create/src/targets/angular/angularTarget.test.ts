import {
  describe,
  expect,
  it,
} from 'vitest';

import { angularTarget } from './angularTarget';

describe('angularTarget', () => {
  it('is the record the angular answer names', () => {
    expect(angularTarget.id).toBe('angular');
  });

  /*
   * The CLI's own project file is the build, the dev server and the test target in one, and every `buildTarget`
   * inside it names the project. That is why it is emitted rather than copied, and this flag is what says so.
   */
  it('has its project file written rather than copied', () => {
    expect(angularTarget.angularProject).toBe(true);
    expect(angularTarget.build).toBe('ng build');
  });

  /*
   * `ng generate`'s own spelling, which every file this template writes already follows. Declarations are excluded
   * because the key below judges them and `check-file` applies every key that matches: `customTypes.d.ts` ships
   * with `typeSafety: relaxed`, and held to both keys at once it could satisfy neither.
   */
  it('names every module the way the CLI would, and leaves declarations to their own key', () => {
    expect(angularTarget.naming['src/**/!(*.d).ts']).toBe('KEBAB_CASE');
    expect(angularTarget.naming).not.toHaveProperty('src/**/*.ts');
    expect(angularTarget.naming['src/**/*.d.ts']).toBeDefined();
  });
});
