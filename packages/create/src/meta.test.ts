import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  directoriesIn,
  sourcesUnder,
  takenFromBarrel,
} from '@mocks/ringShape';
import {
  describe,
  expect,
  it,
} from 'vitest';

interface Ring {
  name: string;
  /**
   * The suffix a subject's entry carries, keyed by the group that decides it. One `''` key is a ring with no group,
   * and an empty string is a ring with no one kind: `terminal/` holds an entrypoint and a questionnaire, so there is
   * nothing to suffix and the entry is named for its directory alone.
   */
  suffixes: Record<string, string>;
}

interface Subject {
  ring: string;
  name: string;
  path: string;
  entry: string;
}

/**
 * Every ring whose members are directories, and the suffix each one's entry takes. `emitters/` and `answers/` carry
 * their own `meta.test.ts` because each holds its registry against the same listing; these five have no registry to
 * hold, so the shape is all there is to check and one table states it once.
 *
 * A ring is named for what its members are, or for the world it reaches when the world is the membership test. The
 * entry takes the singular of whatever names the kind, which is the ring where the ring has one and the group where
 * a group changes it.
 */
const RINGS: Ring[] = [
  {
    name: 'disk',
    suffixes: {
      read: 'Reader',
      write: 'Writer',
    },
  },
  {
    name: 'pipeline',
    suffixes: {
      runs: 'Run',
      passes: 'Pass',
    },
  },
  {
    name: 'spawns',
    suffixes: { '': 'Spawn' },
  },
  {
    name: 'targets',
    suffixes: { '': 'Target' },
  },
  {
    name: 'terminal',
    suffixes: { '': '' },
  },
];

const srcDir = join(import.meta.dirname);

// `utils/` holds what the ring shares and `e2e/` is the harness rather than the package. Neither is a group or a
// subject, and neither is held to the shape below.
const SHARED = new Set(['utils', 'e2e']);

const entryNameOf = (name: string, suffix: string): string => {
  return `${name.replace(/-([a-z])/gu, (_match, letter: string) => {
    return letter.toUpperCase();
  })}${suffix}`;
};

const subjectsIn = (ring: Ring): Subject[] => {
  const ringDir = join(srcDir, ring.name);

  return Object.entries(ring.suffixes).flatMap(([group, suffix]) => {
    const groupDir = join(ringDir, group);

    return directoriesIn(groupDir).filter((name) => {
      return !SHARED.has(name) && !(group === '' && name in ring.suffixes);
    }).map((name) => {
      return {
        ring: ring.name,
        name,
        path: join(groupDir, name),
        entry: entryNameOf(name, suffix),
      };
    });
  });
};

const entriesIn = (path: string): string[] => {
  return readdirSync(path);
};

const modulesIn = (path: string): string[] => {
  return readdirSync(path, {
    withFileTypes: true,
    recursive: true,
  }).filter((entry) => {
    return entry.isFile();
  }).map((entry) => {
    return relative(path, join(entry.parentPath, entry.name));
  });
};

const packageSources = sourcesUnder(srcDir);

describe.each(RINGS)('$name', (ring) => {
  const ringDir = join(srcDir, ring.name);

  it('holds a subject somewhere, so the assertions below are not vacuous', () => {
    expect(subjectsIn(ring).length).toBeGreaterThan(0);
  });

  /**
   * `index.ts` is the ring's public surface: the rings outside it reach it through the barrel rather than into a
   * file. An export nothing out there reads is not a surface, it is a leftover.
   */
  it('exports nothing the rings outside it never take from it', () => {
    const barrel = readFileSync(join(ringDir, 'index.ts'), 'utf8');
    const exported = [...barrel.matchAll(/export \{([^}]*)\} from/gu)].flatMap(([, names]) => {
      return (names ?? '').split(',');
    }).map((name) => {
      return name.replace('type ', '').trim();
    }).filter((name) => {
      return name !== '';
    });

    const taken = takenFromBarrel(ringDir, ring.name);

    expect(exported.filter((name) => {
      return !taken.has(name);
    })).toEqual([]);
  });
});

describe.each(RINGS.flatMap(subjectsIn))('$ring/$name', ({ path, entry }) => {
  it('holds one entry, named for the directory', () => {
    expect(entriesIn(path)).toContain(`${entry}.ts`);
  });

  // `index` means a barrel in this package, and a subject directory is not one.
  it('holds no index', () => {
    expect(entriesIn(path)).not.toContain('index.ts');
  });

  /**
   * One entry, its suite, a `constants.ts` for a table it alone owns, and a `utils/` for its private helpers.
   * Nothing else: a second module loose beside the entry is either a helper, in which case `utils/` is where the
   * `*Utils` suffix is enforced on it, or it is read from outside, in which case it is not this subject's.
   */
  it('holds nothing but its entry, its constants and a utils directory', () => {
    const allowed = new RegExp(`^(${entry}\\.test\\.ts|${entry}\\.ts|constants\\.ts)$`, 'u');

    expect(entriesIn(path).filter((file) => {
      return file !== 'utils' && !allowed.test(file);
    })).toEqual([]);
  });

  it('suffixes every private helper and puts it under utils', () => {
    expect(modulesIn(path).filter((file) => {
      return file.includes('/') && !/^utils\/[a-z][A-Za-z]*Utils(\.test)?\.ts$/u.test(file);
    })).toEqual([]);
  });

  /**
   * What makes a helper private is that one subject reads it. A second reader means it belongs to the group or to
   * the ring, and `<group>/utils/` or `<ring>/utils/` is where it goes. Checked by reading the import sites,
   * because a helper that quietly gained a second consumer still passes every other assertion here.
   */
  it('keeps every module under its utils private to itself', () => {
    const helpers = modulesIn(path).filter((file) => {
      return file.startsWith('utils/') && !file.endsWith('.test.ts');
    });

    expect(helpers.filter((helper) => {
      const specifier = `${relative(srcDir, path)}/${helper.replace(/\.ts$/u, '')}`;

      return packageSources.some((source) => {
        return !source.startsWith(path) && readFileSync(source, 'utf8').includes(specifier);
      });
    })).toEqual([]);
  });
});
