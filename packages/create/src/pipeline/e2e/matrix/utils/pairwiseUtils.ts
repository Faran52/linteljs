import type { Answers } from '@config/types';

export interface PairwiseCase {
  answers: Answers;
}

interface Scored<T> {
  item: T;
  pairs: string[];
}

// A constant axis costs a pair any case covers, so all are listed rather than filtered per target.
const axesOf = (answers: Answers): string[] => {
  return [
    `pm:${answers.packageManager}`,
    `host:${answers.hostedFramework ?? 'none'}`,
    `browser:${answers.browser}`,
    `styling:${answers.styling ?? 'none'}`,
    `form:${answers.form ?? 'none'}`,
    `router:${answers.router ?? 'none'}`,
    `store:${answers.store ?? 'none'}`,
    `data:${answers.data ?? 'none'}`,
    `testing:${answers.testing}`,
    `safety:${answers.typeSafety}`,
  ];
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
  const scored = cases
    .map((item) => {
      return {
        item,
        pairs: pairsOf(item.answers),
      };
    });
  const scoredPairs = scored
    .flatMap(({ pairs }) => {
      return pairs;
    });

  const uncovered = new Set(scoredPairs);
  const gainOf = (pairs: string[]): number => {
    return pairs
      .filter((pair) => {
        return uncovered.has(pair);
      }).length;
  };
  // Ties go to the earlier case, so a label names the same case every run.
  const leader = (): Scored<T> | undefined => {
    return scored
      .reduce<Scored<T> | undefined>((best, candidate) => {
        return best === undefined || gainOf(candidate.pairs) > gainOf(best.pairs) ? candidate : best;
      }, undefined);
  };
  const chosen: T[] = [];

  // Until no case gains a pair, which is exactly when every pair is covered.
  for (let best = leader(); best !== undefined && gainOf(best.pairs) > 0; best = leader()) {
    for (const pair of best.pairs) {
      uncovered.delete(pair);
    }

    chosen.push(best.item);
  }

  return chosen;
};
