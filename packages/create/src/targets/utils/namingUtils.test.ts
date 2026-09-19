import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  COMPONENT,
  DECLARATION,
  FOLDER,
  FOLDER_ROUTED,
} from './namingUtils';

// Globs are pinned character for character, measured against `micromatch@4.0.8` (what `check-file` matches with), so an
// edit here is a policy change, not a refactor.
describe('the measured globs', () => {
  it('holds the component rule as the negative of camelCase', () => {
    expect(COMPONENT).toBe('!([a-z]*[A-Z]*)');
  });

  it('holds declaration and folder rules', () => {
    expect(DECLARATION).toBe('@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))');
    expect(FOLDER).toBe('@(+([a-z0-9])*(-+([a-z0-9]))|__tests__)');
    expect(FOLDER_ROUTED).toBe(String.raw`@(+([a-z0-9])*(-+([a-z0-9]))|__tests__|\[*\]|\(*\)|{*})`);
  });
});
