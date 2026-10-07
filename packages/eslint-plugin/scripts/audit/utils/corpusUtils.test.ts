import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  countMatches,
  filesUnder,
  interleave,
  isFirstSighting,
  messageOf,
  skipReason,
  sourcesFrom,
} from './corpusUtils.ts';

let root: string;

const plant = (path: string): string => {
  const full = join(root, path);

  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, '');

  return full;
};

beforeEach(() => {
  const prefix = join(tmpdir(), 'corpus-');

  root = mkdtempSync(prefix);
});

afterEach(() => {
  vi.doUnmock('node:os');
  vi.resetModules();
  rmSync(root, { recursive: true, force: true });
});

describe('sourcesFrom', () => {
  it('resolves the given directories and drops the missing ones', () => {
    const sources = sourcesFrom([
      root,
      join(root, 'gone'),
      `${root}/./`,
    ]);

    expect(sources).toEqual([root, root]);
  });

  it('falls back to the workspace store, ~/Projects and the real-code clone directory', async () => {
    vi.doMock('node:os', async (importOriginal) => {
      const os = await importOriginal<typeof import('node:os')>();

      const mocked = {
        ...os,
        homedir: () => {
          return join(root, 'home');
        },
        tmpdir: () => {
          return join(root, 'tmp');
        },
      };

      return mocked;
    });

    mkdirSync(join(root, 'home', 'Projects'), { recursive: true });
    mkdirSync(join(root, 'tmp', 'linteljs-real-code'), { recursive: true });
    const fresh = await import('./corpusUtils.ts');

    const sources = fresh.sourcesFrom([]);

    const expected = [
      resolve(import.meta.dirname, '../../../../../node_modules'),
      join(root, 'home', 'Projects'),
      join(root, 'tmp', 'linteljs-real-code'),
    ];
    expect(sources).toEqual(expected);
  });
});

describe('filesUnder', () => {
  it('yields the scripts and skips build output, minified files and other extensions', () => {
    const kept = [
      'a.cjs',
      'a.js',
      'a.jsx',
      'a.mjs',
      'a.ts',
      'a.tsx',
      'deep/er/b.ts',
    ].map(plant);

    [
      'a.min.js',
      'a.json',
      'a.md',
      'node_modules/x.js',
      'dist/x.js',
      'build/x.js',
      '.next/x.js',
      'coverage/x.js',
      '.git/x.js',
      '.stryker-tmp/x.js',
    ].forEach(plant);

    const files = [...filesUnder(root)]
      .toSorted((left, right) => {
        return left.localeCompare(right);
      });
    const expected = kept
      .toSorted((left, right) => {
        return left.localeCompare(right);
      });

    expect(files).toEqual(expected);
  });

  it('descends into a nested node_modules only from inside one', () => {
    const store = join(root, 'node_modules');
    const nested = plant('node_modules/pkg/node_modules/dep/index.js');
    plant('node_modules/pkg/dist/skip.js');

    const files = [...filesUnder(store)];

    expect(files).toEqual([nested]);
  });

  it('follows no symlink', () => {
    plant('real/a.ts');
    symlinkSync(join(root, 'real'), join(root, 'link'));
    symlinkSync(join(root, 'real', 'a.ts'), join(root, 'b.ts'));

    const files = [...filesUnder(root)];

    expect(files).toEqual([join(root, 'real', 'a.ts')]);
  });

  it('reads a missing directory as empty', () => {
    const gone = join(root, 'gone');

    const files = [...filesUnder(gone)];

    expect(files).toEqual([]);
  });
});

describe('interleave', () => {
  it('takes one file from each source in turn until all run dry', () => {
    const first = [
      plant('one/a.ts'),
      plant('one/b.ts'),
      plant('one/c.ts'),
    ];
    const second = [plant('two/a.ts')];

    const files = [...interleave([join(root, 'one'), join(root, 'two')])];

    const expected = [
      first[0],
      second[0],
      first[1],
      first[2],
    ];
    expect(files).toEqual(expected);
  });

  it('yields nothing from no sources', () => {
    const files = [...interleave([])];

    expect(files).toEqual([]);
  });
});

describe('countMatches', () => {
  it('counts every match of a global pattern, and none as zero', () => {
    const some = countMatches('a1b22c', /\d/g);
    const none = countMatches('abc', /\d/g);

    expect(some).toBe(3);
    expect(none).toBe(0);
  });
});

describe('skipReason', () => {
  it('passes ordinary source', () => {
    const reason = skipReason('const a = 1;\nconst b = 2;\n');

    expect(reason).toBeUndefined();
  });

  it('skips a file past 512 KiB as oversized', () => {
    const atLimit = 'x\n'.repeat(262_144);

    const kept = skipReason(atLimit);
    const skipped = skipReason(`${atLimit}x`);

    expect(kept).toBeUndefined();
    expect(skipped).toBe('oversized');
  });

  it('skips compiled output by its source map comment', () => {
    const reason = skipReason('a();\n//# sourceMappingURL=a.js.map\n');

    expect(reason).toBe('compiled');
  });

  it('skips a file whose longest line passes 1000 characters', () => {
    const lines = [...Array.from({ length: 10 }, () => {
      return 'a';
    }), 'x'.repeat(1000)].join('\n');

    const kept = skipReason(lines);
    const skipped = skipReason(`${lines}x`);

    expect(kept).toBeUndefined();
    expect(skipped).toBe('minified');
  });

  it('skips a file whose lines average past 200 characters', () => {
    const two = `${'x'.repeat(200)}\n${'x'.repeat(199)}`;

    const kept = skipReason(two);
    const skipped = skipReason(`${two}x`);

    expect(kept).toBeUndefined();
    expect(skipped).toBe('minified');
  });

  it('passes an empty file', () => {
    const reason = skipReason('');

    expect(reason).toBeUndefined();
  });
});

describe('isFirstSighting', () => {
  it('admits a text once and its copies never', () => {
    const seen = new Set<string>();

    const first = isFirstSighting(seen, 'a');
    const copy = isFirstSighting(seen, 'a');
    const other = isFirstSighting(seen, 'b');

    expect([
      first,
      copy,
      other,
    ]).toEqual([
      true,
      false,
      true,
    ]);
  });
});

describe('messageOf', () => {
  it('keeps the first line of an error message', () => {
    const message = messageOf(new Error('first\nsecond'));

    expect(message).toBe('first');
  });

  it('stringifies what is not an Error', () => {
    const message = messageOf(42);

    expect(message).toBe('42');
  });

  it('cuts a long line at 160 characters', () => {
    const long = new Error('x'.repeat(161));

    const message = messageOf(long);

    expect(message).toBe('x'.repeat(160));
  });
});
