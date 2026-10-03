import { LIBRARIES } from '../constants';

import type { Answers } from '@config/types';

export interface PairwiseCase {
  answers: Answers;
}

// A constant axis costs a pair any case covers, so all are listed rather than filtered per target.
const axesOf = (answers: Answers): string[] => {
  const axes = [
    `pm:${answers.packageManager}`,
    `host:${answers.hostedFramework ?? 'none'}`,
    `browser:${answers.browser}`,
    `styling:${answers.styling ?? 'none'}`,
    `form:${answers.form ?? 'none'}`,
    `router:${answers.router ?? 'none'}`,
    `store:${answers.store ?? 'none'}`,
    `data:${answers.data ?? 'none'}`,
    `mocking:${answers.mocking ?? 'none'}`,
    `languages:${answers.languages?.join(',') ?? 'none'}`,
    `testing:${answers.testing}`,
    `safety:${answers.typeSafety}`,
    ...LIBRARIES
      .map((library) => {
        const isChosen = answers.libraries.includes(library);

        return `${library}:${String(isChosen)}`;
      }),
  ];

  return axes;
};

export const pairsOf = (answers: Answers): string[] => {
  const axes = axesOf(answers);

  return axes
    .flatMap((left, index) => {
      return axes
        .slice(index + 1)
        .map((right) => {
          return `${left}|${right}`;
        });
    });
};

export const coveringSubset = <T extends PairwiseCase>(cases: T[]): T[] => {
  // Each axis value as a small integer and each pair as left * count + right, so a case costs twenty lookups
  // rather than a string per pair, and a round scores a candidate by array reads.
  const valueIds = new Map<string, number>();

  const idOf = (value: string): number => {
    const known = valueIds.get(value) ?? valueIds.size;

    valueIds.set(value, known);

    return known;
  };

  const interned = cases
    .map((item) => {
      const axes = axesOf(item.answers)
        .map(idOf);
      const internedCase = {
        item,
        axes,
      };

      return internedCase;
    });
  const valueCount = valueIds.size;
  const scored = interned
    .map(({ item, axes }) => {
      const pairs = axes
        .flatMap((left, axis) => {
          return axes
            .slice(axis + 1)
            .map((right) => {
              return left * valueCount + right;
            });
        });

      // A gain only falls as pairs are covered, so a stale one bounds it.
      const scoredCase = {
        item,
        pairs,
        staleGain: pairs.length,
      };

      return scoredCase;
    });
  const uncovered = new Uint8Array(valueCount * valueCount)
    .fill(1);

  const gainOf = (pairs: number[]): number => {
    return pairs
      .filter((pair) => {
        return uncovered[pair] === 1;
      }).length;
  };

  type Scored = (typeof scored)[number];

  // A candidate that cannot beat the leader is not rescored, and the picks match a full rescore.
  const bestCandidate = (): Scored | undefined => {
    let best: Scored | undefined;
    let bestGain = 0;

    for (const candidate of scored) {
      if (candidate.staleGain > bestGain) {
        candidate.staleGain = gainOf(candidate.pairs);

        // Strictly greater, so a tie goes to the earlier case and a label names the same case every run.
        if (candidate.staleGain > bestGain) {
          best = candidate;
          bestGain = candidate.staleGain;
        }
      }
    }

    return best;
  };

  const chosen: T[] = [];
  let picked = bestCandidate();

  while (picked !== undefined) {
    for (const pair of picked.pairs) {
      uncovered[pair] = 0;
    }

    chosen.push(picked.item);
    picked = bestCandidate();
  }

  return chosen;
};
