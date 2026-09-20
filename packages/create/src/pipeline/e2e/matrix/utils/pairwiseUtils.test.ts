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

import type { Answers } from '@answers';

const caseFor = (overrides: Partial<Answers>): PairwiseCase => {
  return {
    answers: {
      ...DEFAULT_ANSWERS,
      ...overrides,
    },
  };
};

describe('coveringSubset', () => {
  it('keeps every pair the full list covered', () => {
    const every = [
      caseFor({
        store: true,
        typeSafety: 'strict',
      }),
      caseFor({
        store: false,
        typeSafety: 'relaxed',
      }),
      caseFor({
        store: true,
        typeSafety: 'relaxed',
      }),
      caseFor({
        store: false,
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

  it('answers nothing for nothing', () => {
    expect(coveringSubset([])).toEqual([]);
  });
});
