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
  it('pairs every two axes once', () => {
    const pairs = pairsOf(DEFAULT_ANSWERS);

    expect(pairs).toHaveLength(45);
    expect(new Set(pairs).size).toBe(45);
  });

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

    const coveredPairs = coveringSubset(every)
      .flatMap((item) => {
        return pairsOf(item.answers);
      });

    const covered = new Set(coveredPairs);

    const uncovered = every
      .flatMap((item) => {
        return pairsOf(item.answers);
      })
      .filter((pair) => {
        return !covered.has(pair);
      });

    expect(uncovered).toEqual([]);
  });

  it('drops a case whose pairs another already covers', () => {
    expect(coveringSubset([caseFor({}), caseFor({})])).toHaveLength(1);
  });

  it('breaks a tie towards the earlier case', () => {
    const first = caseFor({ store: 'zustand' });
    const second = caseFor({ store: 'redux-toolkit' });

    expect(coveringSubset([first, second])[0]).toBe(first);
  });

  it('takes the case that covers the most new pairs, not the first that covers any', () => {
    const base = caseFor({
      store: 'redux-toolkit',
      typeSafety: 'strict',
    });
    const oneAxis = caseFor({
      store: 'zustand',
      typeSafety: 'strict',
    });
    const twoAxes = caseFor({
      store: 'zustand',
      typeSafety: 'relaxed',
    });

    expect(coveringSubset([
      base,
      oneAxis,
      twoAxes,
    ])).toEqual([
      base,
      twoAxes,
      oneAxis,
    ]);
  });

  it('answers nothing for nothing', () => {
    expect(coveringSubset([])).toEqual([]);
  });
});
