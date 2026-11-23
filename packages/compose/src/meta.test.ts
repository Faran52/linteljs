import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

const srcDir = import.meta.dirname;

const byName = (left: string, right: string): number => {
  return left.localeCompare(right, 'en');
};

const entryNameOf = (subject: string): string => {
  const camel = subject
    .replace(/-([a-z])/gu, (_match, letter: string) => {
      return letter.toUpperCase();
    });

  return `${camel}Compose`;
};

const subjects = readdirSync(srcDir, { withFileTypes: true })
  .filter((entry) => {
    return entry.isDirectory() && entry.name !== 'utils';
  })
  .map((entry) => {
    return entry.name;
  });

it('holds its subjects, the shared utils and constants, and this suite', () => {
  const loose = readdirSync(srcDir, { withFileTypes: true })
    .filter((entry) => {
      return !entry.isDirectory();
    })
    .map((entry) => {
      return entry.name;
    })
    .toSorted(byName);

  expect(subjects.length).toBeGreaterThan(0);
  expect(loose).toEqual(['constants.ts', 'meta.test.ts']);
});

describe.each(subjects)('%s', (subject) => {
  it('holds its entry and suite, and nothing but a constants.ts, a utils and the shipped subjects beside them', () => {
    const entry = entryNameOf(subject);
    const files = readdirSync(join(srcDir, subject));
    const allowed = [
      `${entry}.ts`,
      `${entry}.test.ts`,
      'constants.ts',
      'utils',
      ...(subject === 'shipped' ? ['subjects'] : []),
    ];
    const strays = files
      .filter((file) => {
        return !allowed.includes(file);
      });

    expect(files).toEqual(expect.arrayContaining([`${entry}.ts`, `${entry}.test.ts`]));
    expect(strays).toEqual([]);
  });
});

const subjectUtils = subjects
  .map((subject) => {
    return join(subject, 'utils');
  });

const utilsDirs = ['utils', ...subjectUtils]
  .filter((dir) => {
    const path = join(srcDir, dir);

    return existsSync(path);
  });

it.each(utilsDirs)('pairs every helper under %s with its suite', (dir) => {
  const files = readdirSync(join(srcDir, dir));
  const sources = files
    .filter((file) => {
      return !file.endsWith('.test.ts');
    });
  const unpaired = sources
    .filter((file) => {
      const suite = file.replace(/\.ts$/u, '.test.ts');

      return !file.endsWith('Utils.ts') || !files.includes(suite);
    });

  expect(sources.length).toBeGreaterThan(0);
  expect(unpaired).toEqual([]);
});

it('holds one data-only constants.ts per shell under shipped/subjects, and the shared one beside them', () => {
  const subjectsDir = join(srcDir, 'shipped/subjects');
  const entries = readdirSync(subjectsDir, { withFileTypes: true });
  const shells = entries
    .filter((entry) => {
      return entry.isDirectory();
    })
    .map((entry) => {
      return entry.name;
    });
  const loose = entries
    .filter((entry) => {
      return !entry.isDirectory();
    })
    .map((entry) => {
      return entry.name;
    });
  const held = new Set(shells
    .map((shell) => {
      const names = readdirSync(join(subjectsDir, shell));

      return names.join();
    }));

  expect(loose).toEqual(['constants.ts']);
  expect([...held]).toEqual(['constants.ts']);
});
