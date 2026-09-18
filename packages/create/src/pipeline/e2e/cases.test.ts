import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { type Answers, TARGET_IDS } from '../../answers/answers';

import { optionCases } from './cases';

// Only the answers are read, so the cases arrive as the narrowest thing that carries them.
interface Answered {
  answers: Answers;
}

/**
 * Derived here rather than imported, so this is a second opinion on what a pair is instead of a restatement of the
 * generator's own. A bug in `axesOf` that dropped an axis would be invisible to a test that shared it.
 */
const pairsOf = (answers: Answers): string[] => {
  const axes = [
    `host:${answers.hostedFramework ?? 'none'}`,
    `browser:${answers.browser}`,
    `form:${answers.form ?? 'none'}`,
    `router:${answers.router ?? 'none'}`,
    `store:${String(answers.store)}`,
    `testing:${answers.testing}`,
    `safety:${answers.typeSafety}`,
  ];

  return axes.flatMap((left, index) => {
    return axes.slice(index + 1).map((right) => {
      return `${left}|${right}`;
    });
  });
};

const coveredBy = (cases: Answered[]): Set<string> => {
  return new Set(cases.flatMap((item) => {
    return pairsOf(item.answers);
  }));
};

const everyCase = (target: (typeof TARGET_IDS)[number]): Answered[] => {
  vi.stubEnv('E2E_FULL', '1');

  const every = optionCases(target);

  vi.unstubAllEnvs();

  return every;
};

describe('optionCases', () => {
  /**
   * The property the reduction rests on. Every defect this suite has found was a two-way interaction: `vue-demi` is
   * hosted-vue with TanStack Query, the devtools floating promise is the extension on chrome, the leftover suites are
   * `testing: none` on angular and react-native, and `customTypes.d.ts` is `typeSafety: relaxed` on angular.
   */
  it('covers every pair of answers the full enumeration reaches', () => {
    for (const target of TARGET_IDS) {
      const missing = [...coveredBy(everyCase(target))].filter((pair) => {
        return !coveredBy(optionCases(target)).has(pair);
      });

      expect(`${target}: ${missing.join(', ')}`).toBe(`${target}: `);
    }
  });

  it('is a fraction of the cross product it covers', () => {
    const reduced = TARGET_IDS.reduce((total, target) => {
      return total + optionCases(target).length;
    }, 0);
    const every = TARGET_IDS.reduce((total, target) => {
      return total + everyCase(target).length;
    }, 0);

    expect(every).toBeGreaterThan(reduced * 3);
  });

  // Each of the four, named by the answers that produced it, so a reduction that lost one fails here rather than in
  // a three hour run.
  it('keeps the combination behind every defect the matrix has found', () => {
    const has = (target: (typeof TARGET_IDS)[number], match: (answers: Answers) => boolean): boolean => {
      return optionCases(target).some((item) => {
        return match(item.answers);
      });
    };

    expect(has('astro', (answers) => {
      return answers.hostedFramework === 'vue';
    })).toBe(true);
    expect(has('webextension', (answers) => {
      return answers.hostedFramework === 'vue';
    })).toBe(true);
    expect(has('webextension', (answers) => {
      return answers.browser === 'chrome';
    })).toBe(true);
    expect(has('angular', (answers) => {
      return answers.testing === 'none';
    })).toBe(true);
    expect(has('react-native', (answers) => {
      return answers.testing === 'none';
    })).toBe(true);
    expect(has('angular', (answers) => {
      return answers.typeSafety === 'relaxed';
    })).toBe(true);
  });

  it('is stable, so the shard stride names the same cases twice running', () => {
    for (const target of TARGET_IDS) {
      expect(optionCases(target).map((item) => {
        return item.label;
      })).toEqual(optionCases(target).map((item) => {
        return item.label;
      }));
    }
  });
});
