import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import {
  coveringSubset,
  pairsOf,
  type PairwiseCase,
} from './pairwiseUtils';

import type { Answers } from '@config/types';

const caseFor = (overrides: Partial<Answers>): PairwiseCase => {
  return {
    answers: answersFor(overrides),
  };
};

describe('pairsOf', () => {
  // Ten axes, each pair once and in one order: an axis paired with itself or twice over would weigh the greedy.
  it('pairs every two axes once', () => {
    const pairs = pairsOf(DEFAULT_ANSWERS);

    expect(pairs).toHaveLength(45);
    expect(new Set(pairs).size).toBe(45);
  });

  // An unset optional answer is its own value, spelled so it cannot be mistaken for a real one.
  it('names an unset answer none', () => {
    expect(pairsOf(DEFAULT_ANSWERS)).toEqual(expect.arrayContaining([
      'host:none|browser:chrome',
      'styling:none|form:none',
      'router:none|store:none',
      'store:none|data:none',
    ]));
  });
});

describe('coveringSubset', () => {
  it('keeps every pair the full list covered', () => {
    const every = [
      caseFor({
        store: 'zustand',
        typeSafety: 'strict',
      }),
      caseFor({
        store: 'redux-toolkit',
        typeSafety: 'relaxed',
      }),
      caseFor({
        store: 'zustand',
        typeSafety: 'relaxed',
      }),
      caseFor({
        store: 'redux-toolkit',
        typeSafety: 'strict',
      }),
    ];

    const covered = new Set(coveringSubset(every).flatMap((item) => {
      return pairsOf(item.answers);
    }));

    expect(every.flatMap((item) => {
      return pairsOf(item.answers);
    }).filter((pair) => {
      return !covered.has(pair);
    })).toEqual([]);
  });

  it('drops a case whose pairs another already covers', () => {
    expect(coveringSubset([caseFor({}), caseFor({})])).toHaveLength(1);
  });

  // Ties go to the earlier case, which is what keeps a label naming the same case on every run.
  it('breaks a tie towards the earlier case', () => {
    const first = caseFor({ store: 'zustand' });
    const second = caseFor({ store: 'redux-toolkit' });

    expect(coveringSubset([first, second])[0]).toBe(first);
  });

  it('answers nothing for nothing', () => {
    expect(coveringSubset([])).toEqual([]);
  });
});
