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
  expect([...new Set(RINGS)]).toStrictEqual([...RINGS]);
});

// The pipeline sequences the other three and reaches no world of its own.
it('gives every outer ring but the pipeline a world', () => {
  const owningRings = OUTER_RINGS
    .filter((ring) => {
      return ring !== 'pipeline';
    });

  expect(Object.keys(WORLDS)).toStrictEqual(owningRings);
});

// Every module the root `eslint.config.ts` holds to WORLDS, and what each imports: the tests and the e2e harness are
// exempt there, so they are here.
const importsBySource = (): [string, string[]][] => {
  return modulesIn(import.meta.dirname)
    .filter((path) => {
      return path.endsWith('.ts') && !path.endsWith('.test.ts') && !path.startsWith('pipeline/e2e/');
    })
    .map((path) => {
      const text = readFileSync(join(import.meta.dirname, path), 'utf8');

      return [path, [...text.matchAll(/(?:from|import) '([^']+)';/gu)]
        .map(([, specifier = '']) => {
          return specifier;
        })];
    });
};

/*
 * The same data the lint rule reads, held to the tree it describes: a world's imports appear only in its own ring,
 * every pattern names an import that ring really makes, and the message sends a reader to that ring.
 */
it.each(Object.entries(WORLDS))('keeps what reaches %s inside that ring', (name, world) => {
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

  expect(ringDirectories).toStrictEqual([...RINGS].toSorted(byName));
});
