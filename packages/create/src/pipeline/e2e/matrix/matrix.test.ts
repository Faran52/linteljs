import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import {
  ANSWERS,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  parseLinteljsConfig,
} from '@answers';
import { targetFor } from '@targets';

import { targetCases } from './matrix';

import type { Answers } from '@config/types';

// Only the answers are read, so the cases arrive as the narrowest thing that carries them.
interface Answered {
  answers: Answers;
}

const TARGET_IDS = valuesOf(ANSWERS.target.values);

/**
 * Derived here rather than imported, so this is a second opinion on what a pair is instead of a restatement of the
 * generator's own. A bug in `axesOf` that dropped an axis would be invisible to a test that shared it, and one did:
 * both copies once left out `styling` and `data`, so the vue-demi pair was never promised.
 */
const pairsOf = (answers: Answers): string[] => {
  const axes = Object.entries({
    packageManager: answers.packageManager,
    hostedFramework: answers.hostedFramework,
    browser: answers.browser,
    styling: answers.styling,
    form: answers.form,
    router: answers.router,
    store: answers.store,
    data: answers.data,
    testing: answers.testing,
    typeSafety: answers.typeSafety,
  }).map(([axis, value]) => {
    return `${axis}=${value ?? '-'}`;
  });

  return axes.flatMap((left, index) => {
    return axes.slice(index + 1).map((right) => {
      return `${left}&${right}`;
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

  const every = targetCases(target);

  vi.unstubAllEnvs();

  return every;
};

const accepts = (answers: Answers): boolean => {
  try {
    parseLinteljsConfig(JSON.stringify({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...answers,
    }));

    return true;
  }
  catch {
    return false;
  }
};

// Every case of every target, before the reduction.
const everyTargetsCases = (): Answered[] => {
  return TARGET_IDS.flatMap(everyCase);
};

describe('targetCases', () => {
  // The property the reduction rests on: every defect this suite has found was a two-way interaction.
  it('covers every pair of answers the full enumeration reaches', () => {
    for (const target of TARGET_IDS) {
      const covered = coveredBy(targetCases(target));
      const missing = [...coveredBy(everyCase(target))].filter((pair) => {
        return !covered.has(pair);
      });

      expect(`${target}: ${missing.join(', ')}`).toBe(`${target}: `);
    }
  });

  it('is a fraction of the cross product it covers', () => {
    const reduced = TARGET_IDS.reduce((total, target) => {
      return total + targetCases(target).length;
    }, 0);
    const every = TARGET_IDS.reduce((total, target) => {
      return total + everyCase(target).length;
    }, 0);

    expect(every).toBeGreaterThan(reduced * 3);
  });

  // Named by the answers that produced each defect, so a reduction that lost one fails here rather than in a run of
  // hours.
  it('keeps the combination behind every defect the matrix has found', () => {
    const has = (target: (typeof TARGET_IDS)[number], match: (answers: Answers) => boolean): boolean => {
      return targetCases(target).some((item) => {
        return match(item.answers);
      });
    };

    expect(has('astro', (answers) => {
      return answers.hostedFramework === 'vue' && answers.data === 'tanstack-query';
    })).toBe(true);
    expect(has('webextension', (answers) => {
      return answers.hostedFramework === 'vue' && answers.data === 'tanstack-query';
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
    expect(has('react', (answers) => {
      return answers.packageManager === 'yarn-classic';
    })).toBe(true);
  });

  // Through the config parser, which is what refuses a combination the prompt would never offer.
  it('enumerates only answers the CLI accepts', () => {
    for (const { label, answers } of everyTargetsCases().map((item) => {
      return {
        label: JSON.stringify(item.answers),
        answers: item.answers,
      };
    })) {
      expect([label, accepts(answers)]).toEqual([label, true]);
    }
  });

  /*
   * The one axis whose offer depends on another answer: a form library binds a framework, and a hosted framework
   * decides which one an Astro or extension project renders. Judged by the parser rather than by the generator's own
   * reading of the target record, and in both directions.
   */
  it('offers a form library exactly where the CLI accepts one', () => {
    for (const target of TARGET_IDS) {
      const cases = everyCase(target);
      const hosts = [...new Set(cases.map(({ answers }) => {
        return answers.hostedFramework;
      }))];

      for (const hostedFramework of hosts) {
        for (const form of valuesOf(ANSWERS.form.values)) {
          const accepted = accepts({
            ...DEFAULT_ANSWERS,
            target,
            ...(hostedFramework === undefined ? {} : { hostedFramework }),
            form,
          });
          const offered = cases.some(({ answers }) => {
            return answers.hostedFramework === hostedFramework && answers.form === form;
          });

          expect([target, hostedFramework, form, offered]).toEqual([target, hostedFramework, form, accepted]);
        }
      }
    }
  });

  // `exactOptionalPropertyTypes` holds an unset answer to absent, and so does every reader of a parsed config.
  it('leaves an unset answer out rather than setting it to undefined', () => {
    for (const { answers } of everyTargetsCases()) {
      expect(Object.entries(answers).filter(([, value]) => {
        return value === undefined;
      })).toEqual([]);
    }
  });

  it('offers every value of every single-select axis, and none on each optional one', () => {
    const answered = everyTargetsCases().map(({ answers }) => {
      return answers;
    });
    const seen = (read: (answers: Answers) => string | undefined): (string | undefined)[] => {
      return [...new Set(answered.map(read))].toSorted((left, right) => {
        return (left ?? '').localeCompare(right ?? '');
      });
    };
    const all = (values: readonly string[], optional: boolean): (string | undefined)[] => {
      return [...(optional ? [undefined] : []), ...values].toSorted((left, right) => {
        return (left ?? '').localeCompare(right ?? '');
      });
    };

    expect(seen(({ packageManager }) => {
      return packageManager;
    })).toEqual(all(valuesOf(ANSWERS.packageManager.values), false));
    expect(seen(({ testing }) => {
      return testing;
    })).toEqual(all(valuesOf(ANSWERS.testing.values), false));
    expect(seen(({ typeSafety }) => {
      return typeSafety;
    })).toEqual(all(valuesOf(ANSWERS.typeSafety.values), false));
    expect(seen(({ browser }) => {
      return browser;
    })).toEqual(all(valuesOf(ANSWERS.browser.values), false));
    expect(seen(({ hostedFramework }) => {
      return hostedFramework;
    })).toEqual(all(valuesOf(ANSWERS.hostedFramework.values), true));
    expect(seen(({ styling }) => {
      return styling;
    })).toEqual(all(valuesOf(ANSWERS.styling.values), true));
    expect(seen(({ form }) => {
      return form;
    })).toEqual(all(valuesOf(ANSWERS.form.values), true));
    expect(seen(({ router }) => {
      return router;
    })).toEqual(all(valuesOf(ANSWERS.router.values), true));
    expect(seen(({ store }) => {
      return store;
    })).toEqual(all(valuesOf(ANSWERS.store.values), true));
    expect(seen(({ data }) => {
      return data;
    })).toEqual(all(valuesOf(ANSWERS.data.values), true));
  });

  // A multi-select is never combined, so every case carries a target's heaviest dependency set.
  it('carries every multi-select at its full value, and surfaces only where a target has them', () => {
    for (const { answers } of everyTargetsCases()) {
      expect(answers.libraries).toEqual(valuesOf(ANSWERS.libraries.values));
      expect(answers.agents).toEqual(valuesOf(ANSWERS.agents.values));
      expect(answers.plugins).toEqual(valuesOf(ANSWERS.plugins.values));
      expect(answers.surfaces).toEqual(answers.target === 'webextension'
        ? valuesOf(ANSWERS.surfaces.values)
        : undefined);
    }
  });

  // Every axis that varies, in a fixed order: the label names the case and the directory it runs in.
  it('labels each case by every answer that can vary on its target', () => {
    for (const { label, answers } of TARGET_IDS.flatMap(targetCases)) {
      const record = targetFor(answers);
      const expected = [
        answers.target,
        answers.packageManager,
        answers.testing,
        answers.typeSafety,
        record.hostsBrowser === true ? answers.browser : undefined,
        record.hostsFramework === true ? `host-${answers.hostedFramework ?? 'none'}` : undefined,
        answers.form,
        answers.router,
        answers.store,
        answers.styling,
        answers.data,
      ].filter((part) => {
        return part !== undefined;
      });

      expect(label).toBe(expected.join(' '));
    }
  });

  it('runs every target on every package manager', () => {
    for (const target of TARGET_IDS) {
      const managers = new Set(targetCases(target).map((item) => {
        return item.answers.packageManager;
      }));

      expect([target, [...managers].sort((left, right) => {
        return left.localeCompare(right);
      })]).toEqual([target, valuesOf(ANSWERS.packageManager.values).toSorted((left, right) => {
        return left.localeCompare(right);
      })]);
    }
  });

  it('gives every case its own label, which names the directory it runs in', () => {
    const labels = TARGET_IDS.flatMap((target) => {
      return targetCases(target).map((item) => {
        return item.label;
      });
    });

    expect(new Set(labels).size).toBe(labels.length);
  });

  it('is stable, so a label names the same case twice running', () => {
    for (const target of TARGET_IDS) {
      expect(targetCases(target).map((item) => {
        return item.label;
      })).toEqual(targetCases(target).map((item) => {
        return item.label;
      }));
    }
  });
});
