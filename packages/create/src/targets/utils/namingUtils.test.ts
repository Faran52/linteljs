import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  componentNaming,
  scriptKeys,
  sfcNaming,
} from './namingUtils';

// The globs these compose are pinned character for character, measured against `micromatch@4.0.8`, which is what
// `check-file` matches with, so an edit here is a policy change rather than a refactor.
describe('scriptKeys', () => {
  it('reaches every script under src/ where no route directory is named', () => {
    expect(scriptKeys()).toStrictEqual({ 'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE' });
  });

  it('takes a second key for the file sitting directly in src/ where one is', () => {
    expect(scriptKeys('app')).toStrictEqual({
      'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/!(app)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
    });
  });
});

describe('componentNaming', () => {
  it('names every tsx a component, every other script camelCase and every declaration file', () => {
    expect(componentNaming()).toStrictEqual({
      'src/**/*.tsx': '!([a-z]*[A-Z]*)',
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    });
  });

  it('routes the script keys around the route directory it is given', () => {
    expect(componentNaming('app')).toHaveProperty(['src/!(app)/**/!(*.d|*.test|*.spec).ts'], 'CAMEL_CASE');
  });
});

describe('sfcNaming', () => {
  it('marks the component by the framework extension it is given', () => {
    expect(sfcNaming('vue')).toStrictEqual({
      'src/**/*.vue': '!([a-z]*[A-Z]*)',
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    });

    expect(sfcNaming('svelte', 'routes')).toHaveProperty(['src/**/*.svelte'], '!([a-z]*[A-Z]*)');
  });
});
