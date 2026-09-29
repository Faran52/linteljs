import type { Answers } from '@config/types';

export interface PairwiseCase {
  answers: Answers;
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
  const chosen: T[] = [];
  let remaining = scored;

  // Each pick covers a pair, so the uncovered count bounds the rounds. A case that gains nothing is dropped,
  // so an emptied pool ends them.
  Array.from({ length: uncovered.size })
    .some(() => {
      const ranked = remaining
        .map((candidate) => {
          return {
            candidate,
            gain: gainOf(candidate.pairs),
          };
        })
        .filter(({ gain }) => {
          return gain > 0;
        });

      remaining = ranked
        .map(({ candidate }) => {
          return candidate;
        });

      // Ties go to the earlier case, so a label names the same case every run.
      const best = ranked
        .reduce<typeof ranked[number] | undefined>((leader, entry) => {
          return leader === undefined || entry.gain > leader.gain ? entry : leader;
        }, undefined);

      if (best === undefined) {
        return true;
      }

      for (const pair of best.candidate.pairs) {
        uncovered.delete(pair);
      }

      chosen.push(best.candidate.item);

      return false;
    });

  return chosen;
};
