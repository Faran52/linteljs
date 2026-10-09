import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isShare,
  mergedShare,
  shareOf,
  stringOf,
  stringRecordOf,
  stringsOf,
} from './shareUtils';

describe('isShare', () => {
  it('takes an object and refuses a list or null', () => {
    const object = isShare({});
    const list = isShare([]);
    const empty = isShare(null);

    expect(object).toBe(true);
    expect(list).toBe(false);
    expect(empty).toBe(false);
  });
});

describe('mergedShare', () => {
  it('merges objects deep, joins lists without repeats and keeps equal values', () => {
    const left = {
      package: { dependencies: { react: '^19.0.0' } },
      css: ['a', 'b'],
      flag: true,
    };
    const right = {
      package: { dependencies: { zod: '^4.0.0' } },
      css: ['b', 'c'],
      flag: true,
      extra: 1,
    };

    const merged = mergedShare(left, right);

    expect(merged).toEqual({
      package: {
        dependencies: {
          react: '^19.0.0',
          zod: '^4.0.0',
        },
      },
      css: [
        'a',
        'b',
        'c',
      ],
      flag: true,
      extra: 1,
    });
  });

  it('refuses one key at two values, naming its path', () => {
    const left = { package: { dependencies: { react: '^19.0.0' } } };
    const right = { package: { dependencies: { react: '^18.0.0' } } };

    const merging = (): void => {
      mergedShare(left, right);
    };

    expect(merging).toThrow('package.dependencies.react is "^19.0.0" in one drawer and "^18.0.0" in another');
  });
});

describe('shareOf', () => {
  it('reads an object, an empty one when absent, and refuses another shape', () => {
    const share = {
      eslint: { react: true },
      css: ['a'],
    };

    const present = shareOf(share, 'eslint');
    const absent = shareOf(share, 'routes');

    const reading = (): void => {
      shareOf(share, 'css');
    };

    expect(present).toEqual({ react: true });
    expect(absent).toEqual({});
    expect(reading).toThrow('share key css must be an object');
  });
});

describe('stringsOf', () => {
  it('reads a list of strings, an empty one when absent, and refuses another shape', () => {
    const share = {
      css: ['a'],
      mixed: ['a', 1],
      flag: true,
    };

    const present = stringsOf(share, 'css');
    const absent = stringsOf(share, 'locales');

    const mixed = (): void => {
      stringsOf(share, 'mixed');
    };

    const scalar = (): void => {
      stringsOf(share, 'flag');
    };

    expect(present).toEqual(['a']);
    expect(absent).toEqual([]);
    expect(mixed).toThrow('share key mixed must be a list of strings');
    expect(scalar).toThrow('share key flag must be a list of strings');
  });
});

describe('stringRecordOf', () => {
  it('reads names to strings and refuses another value', () => {
    const share = {
      scripts: { dev: 'vite' },
      bad: { dev: 1 },
    };

    const present = stringRecordOf(share, 'scripts');

    const reading = (): void => {
      stringRecordOf(share, 'bad');
    };

    expect(present).toEqual({ dev: 'vite' });
    expect(reading).toThrow('share key bad must map names to strings');
  });
});

describe('stringOf', () => {
  it('reads a string and refuses an absent or other value', () => {
    const share = {
      cssFile: 'src/index.css',
      flag: true,
    };

    const present = stringOf(share, 'cssFile');

    const absent = (): void => {
      stringOf(share, 'routesFile');
    };

    const scalar = (): void => {
      stringOf(share, 'flag');
    };

    expect(present).toBe('src/index.css');
    expect(absent).toThrow('share key routesFile must be a string');
    expect(scalar).toThrow('share key flag must be a string');
  });
});
