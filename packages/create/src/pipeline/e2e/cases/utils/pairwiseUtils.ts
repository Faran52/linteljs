import type { Answers } from '../../../../answers';

// What the solver reads of a case, which is the answers and nothing else.
export interface PairwiseCase {
  answers: Answers;
}

interface Leader<T> {
  item?: T;
  gain: number;
}

// The axes a case is a point in. A constant one costs a pair that any case covers, so they are all listed rather
// than filtered per target: the arithmetic is the same and the list stays readable.
const axesOf = (answers: Answers): string[] => {
  return [
    `host:${answers.hostedFramework ?? 'none'}`,
    `browser:${answers.browser}`,
    `form:${answers.form ?? 'none'}`,
    `router:${answers.router ?? 'none'}`,
    `store:${String(answers.store)}`,
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
 * The greedy set cover over every pair of answers: enough cases that each pair appears at least once, which is what
 * turns the full cross product into the 98 the suite runs. Generic over what a case is, because the solver reads
 * nothing but the answers a case carries.
 */
export const coveringSubset = <T extends PairwiseCase>(cases: T[]): T[] => {
  const uncovered = new Set(cases.flatMap((item) => {
    return pairsOf(item.answers);
  }));
  const chosen: T[] = [];

  while (uncovered.size > 0) {
    const best = cases.reduce<Leader<T>>((leader, item) => {
      const gain = pairsOf(item.answers).filter((pair) => {
        return uncovered.has(pair);
      }).length;

      return gain > leader.gain
        ? {
            item,
            gain,
          }
        : leader;
    }, { gain: 0 });

    // Unreachable: every pair in `uncovered` came from a case, so some case always gains.
    if (best.item === undefined) {
      break;
    }

    for (const pair of pairsOf(best.item.answers)) {
      uncovered.delete(pair);
    }

    chosen.push(best.item);
  }

  return chosen;
};
