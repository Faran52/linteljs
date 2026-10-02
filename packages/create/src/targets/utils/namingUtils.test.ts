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

describe('scriptKeys', () => {
  it('reaches every script under src/ where no route directory is named', () => {
    const actual = scriptKeys();
    const expected = {
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      '**/utils/*.ts': '*Utils',
    };
    expect(actual).toStrictEqual(expected);
  });

  it('takes a second key for the file sitting directly in src/ where one is', () => {
    const actual = scriptKeys('app');
    const expected = {
      'src/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/!(app)/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      '**/utils/*.ts': '*Utils',
    };
    expect(actual).toStrictEqual(expected);
  });
});

describe('componentNaming', () => {
  it('names every tsx a component, every other script camelCase and every declaration file', () => {
    const actual = componentNaming();
    const expected = {
      'src/**/*.tsx': '!([a-z]*[A-Z]*)',
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      '**/utils/*.ts': '*Utils',
      'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    };
    expect(actual).toStrictEqual(expected);
  });

  it('routes the script keys around the route directory it is given', () => {
    const actual = componentNaming('app');
    const expected = ['src/!(app)/**/!(*.d|*.test|*.spec).ts'];
    expect(actual).toHaveProperty(expected, 'CAMEL_CASE');
  });
});

describe('sfcNaming', () => {
  it('marks the component by the framework extension it is given', () => {
    const actual = sfcNaming('vue');
    const expected = {
      'src/**/*.vue': '!([a-z]*[A-Z]*)',
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      '**/utils/*.ts': '*Utils',
      'src/**/*.d.ts': '@(+([a-z0-9])*(-+([a-z0-9]))|+([a-z])*([a-zA-Z0-9]))',
    };
    expect(actual).toStrictEqual(expected);

    const svelteRoutes = sfcNaming('svelte', 'routes');
    const sfcPath = ['src/**/*.svelte'];
    expect(svelteRoutes).toHaveProperty(sfcPath, '!([a-z]*[A-Z]*)');
  });
});
