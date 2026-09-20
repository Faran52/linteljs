import { directoriesIn } from '@mocks/ringShape';
import { expect, it } from 'vitest';

import {
  OUTER_RINGS,
  RINGS,
  WORLDS,
} from './rings';

it('names every ring once', () => {
  expect([...new Set(RINGS)]).toStrictEqual([...RINGS]);
});

it('places every world in an outer ring', () => {
  for (const name of Object.keys(WORLDS)) {
    expect(OUTER_RINGS).toContain(name);
  }
});

it('lists the directories under src/', () => {
  const byName = (left: string, right: string): number => {
    return left.localeCompare(right, 'en');
  };

  expect(directoriesIn(import.meta.dirname).toSorted(byName)).toStrictEqual([...RINGS].toSorted(byName));
});
