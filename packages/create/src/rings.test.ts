import { readFileSync } from 'node:fs';
import { join, matchesGlob } from 'node:path';

import { byName } from '@mocks/byName';
import { directoriesIn, modulesIn } from '@mocks/ringShape';
import { expect, it } from 'vitest';

import {
  OUTER_RINGS,
  RINGS,
  WORLDS,
} from './rings';

it('names every ring once', () => {
  const actual = [...new Set(RINGS)];
  const expected = [...RINGS];
  expect(actual).toStrictEqual(expected);
});

it('gives every outer ring but the pipeline a world', () => {
  const owningRings = OUTER_RINGS
    .filter((ring) => {
      return ring !== 'pipeline';
    });

  const actual = Object.keys(WORLDS);
  expect(actual).toStrictEqual(owningRings);
});

const importsBySource = (): [string, string[]][] => {
  return modulesIn(import.meta.dirname)
    .filter((path) => {
      return path.endsWith('.ts') && !path.endsWith('.test.ts');
    })
    .map((path) => {
      const text = readFileSync(join(import.meta.dirname, path), 'utf8');

      const matches = [...text.matchAll(/(?:from|import) '([^']+)';/gu)];
      const specifiers = matches
        .map(([, specifier = '']) => {
          return specifier;
        });
      const imports: [string, string[]] = [path, specifiers];
      return imports;
    });
};

const WORLD_ENTRIES = Object.entries(WORLDS);

it.each(WORLD_ENTRIES)('keeps what reaches %s inside that ring', (name, world) => {
  const sources = importsBySource();
  const worldRings = Object.keys(WORLDS);

  const reaching = (specifiers: string[]): string[] => {
    return specifiers
      .filter((specifier) => {
        return world.group
          .some((pattern) => {
            return matchesGlob(specifier, pattern);
          });
      });
  };

  const reachingOutside = sources
    .filter(([path, specifiers]) => {
      return !worldRings
        .some((ring) => {
          return path.startsWith(`${ring}/`);
        }) && reaching(specifiers).length > 0;
    });

  expect(reachingOutside).toEqual([]);

  const own = sources
    .filter(([path]) => {
      return path.startsWith(`${name}/`);
    })
    .flatMap(([, specifiers]) => {
      return specifiers;
    });

  expect(reaching(own).length).toBeGreaterThan(0);

  for (const pattern of world.group) {
    const matched = own
      .some((specifier) => {
        return matchesGlob(specifier, pattern);
      });

    expect(matched).toBe(true);
  }

  expect(world.message).toContain(`${name}/`);
});

it('lists the directories under src/', () => {
  const ringDirectories = directoriesIn(import.meta.dirname)
    .toSorted(byName);

  const expected = [...RINGS].toSorted(byName);
  expect(ringDirectories).toStrictEqual(expected);
});
