import type { Answers } from '@config/types';

// What the solver reads of a case, which is the answers and nothing else.
export interface PairwiseCase {
  answers: Answers;
}

interface Scored<T> {
  item: T;
  pairs: string[];
}

// The axes a case is a point in. A constant one costs a pair that any case covers, so they are all listed rather
// than filtered per target: the arithmetic is the same and the list stays readable.
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

  return axes.flatMap((left, index) => {
    return axes.slice(index + 1).map((right) => {
      return `${left}|${right}`;
    });
  });
};

/**
 * The greedy set cover over every pair of answers: enough cases that each pair appears at least once. Generic over
 * what a case is, because the solver reads nothing but the answers a case carries. Each case's pairs are derived
 * once; the greedy only counts which of them are still uncovered.
 */
export const coveringSubset = <T extends PairwiseCase>(cases: T[]): T[] => {
  const scored = cases.map((item) => {
    return {
      item,
      pairs: pairsOf(item.answers),
    };
  });
  const uncovered = new Set(scored.flatMap(({ pairs }) => {
    return pairs;
  }));
  const gainOf = (pairs: string[]): number => {
    return pairs.filter((pair) => {
      return uncovered.has(pair);
    }).length;
  };
  // Ties go to the earlier case, which keeps the cover stable, so a label names the same case every run.
  const leader = (): Scored<T> | undefined => {
    return scored.reduce<Scored<T> | undefined>((best, candidate) => {
      return best === undefined || gainOf(candidate.pairs) > gainOf(best.pairs) ? candidate : best;
    }, undefined);
  };
  const chosen: T[] = [];

  // Until no case gains a pair, which is exactly when every pair is covered, since each pair came from some case.
  for (let best = leader(); best !== undefined && gainOf(best.pairs) > 0; best = leader()) {
    for (const pair of best.pairs) {
      uncovered.delete(pair);
    }

    chosen.push(best.item);
  }

  return chosen;
};
