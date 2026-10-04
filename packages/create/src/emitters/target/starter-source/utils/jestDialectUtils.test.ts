import {
  describe,
  expect,
  it,
} from 'vitest';

import { inJestDialect } from './jestDialectUtils';

const VITEST_SUITE = `import {
  afterEach,
  describe,
  it,
  vi,
} from 'vitest';

import { request } from './fetchExtendedUtils';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  navi.reset();
});
`;

const JEST_SUITE = `import { request } from './fetchExtendedUtils';

const fetchMock = jest.fn();

beforeEach(() => {
  jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
});

afterEach(() => {
  jest.restoreAllMocks();
  navi.reset();
});
`;

describe('inJestDialect', () => {
  it('drops the vitest import and names every vi member under jest', () => {
    const actual = inJestDialect(VITEST_SUITE);
    expect(actual).toBe(JEST_SUITE);
  });

  it('keeps the blank line between the import groups either side of the vitest one', () => {
    const source = [
      "import { configureStore } from '@reduxjs/toolkit';",
      "import { it } from 'vitest';",
      '',
      "import { a } from './a';",
      '',
    ].join('\n');
    const actual = inJestDialect(source);
    expect(actual).toBe("import { configureStore } from '@reduxjs/toolkit';\n\nimport { a } from './a';\n");
  });

  it('leaves a suite already in the jest dialect as written', () => {
    const actual = inJestDialect(JEST_SUITE);
    expect(actual).toBe(JEST_SUITE);
  });
});
