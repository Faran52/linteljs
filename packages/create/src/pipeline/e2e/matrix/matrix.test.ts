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

import { type E2eCase, targetCases } from './matrix';

import type { Answers } from '@config/types';

interface Answered {
  answers: Answers;
}

type TestedTarget = (typeof TARGET_IDS)[number];

const TARGET_IDS = valuesOf(ANSWERS.target.values);

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
    mocking: answers.mocking,
    languages: answers.languages?.join(','),
    testing: answers.testing,
    typeSafety: answers.typeSafety,
    ...Object.fromEntries(valuesOf(ANSWERS.libraries.values)
      .map((library) => {
        return [library, String(answers.libraries.includes(library))];
      })),
  })
    .map(([axis, value]) => {
      return `${axis}=${value ?? '-'}`;
    });

  return axes
    .flatMap((left, index) => {
      return axes
        .slice(index + 1)
        .map((right) => {
          return `${left}&${right}`;
        });
    });
};

const coveredBy = (cases: Answered[]): Set<string> => {
  const coveredPairs = cases
    .flatMap((item) => {
      return pairsOf(item.answers);
    });

  return new Set(coveredPairs);
};

// Each enumeration once per target, since the cover takes seconds; the stability test calls targetCases afresh.
const memoised = <T>(compute: (target: TestedTarget) => T): ((target: TestedTarget) => T) => {
  const cache = new Map<TestedTarget, T>();

  return (target) => {
    const known = cache.get(target) ?? compute(target);

    cache.set(target, known);

    return known;
  };
};

const pairedCases = memoised(targetCases);

const everyCase = memoised((target) => {
  vi.stubEnv('E2E_FULL', '1');

  const every = targetCases(target);

  vi.unstubAllEnvs();

  return every;
});

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

const everyTargetsCases = (): Answered[] => {
  return TARGET_IDS.flatMap(everyCase);
};

describe('targetCases', () => {
  it('covers every pair of answers the full enumeration reaches', () => {
    for (const target of TARGET_IDS) {
      const covered = coveredBy(pairedCases(target));
      const missing = [...coveredBy(everyCase(target))]
        .filter((pair) => {
          return !covered.has(pair);
        });

      expect(`${target}: ${missing.join(', ')}`).toBe(`${target}: `);
    }
  });

  it('is a fraction of the cross product it covers', () => {
    const reduced = TARGET_IDS
      .reduce((total, target) => {
        return total + pairedCases(target).length;
      }, 0);
    const every = TARGET_IDS
      .reduce((total, target) => {
        return total + everyCase(target).length;
      }, 0);

    expect(every).toBeGreaterThan(reduced * 3);
  });

  it('keeps the combination behind every defect the matrix has found', () => {
    const has = (target: (typeof TARGET_IDS)[number], match: (answers: Answers) => boolean): boolean => {
      return pairedCases(target)
        .some((item) => {
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
    expect(has('react', (answers) => {
      return answers.router === 'react-router-framework' && answers.styling === 'stylex';
    })).toBe(true);
    expect(has('next', (answers) => {
      return answers.store === 'zustand' && answers.form === 'tanstack-form';
    })).toBe(true);
    expect(has('next', (answers) => {
      return answers.styling === 'stylex';
    })).toBe(true);
    expect(has('angular', (answers) => {
      return answers.form === undefined;
    })).toBe(true);
    expect(has('angular', (answers) => {
      return answers.form === 'tanstack-form' && answers.libraries.includes('zod');
    })).toBe(true);
  });

  it('offers no languages or every one on every target', () => {
    for (const target of TARGET_IDS) {
      const chosen = everyCase(target)
        .map(({ answers }) => {
          return answers.languages?.join(',') ?? 'none';
        });
      const expected = ['none', valuesOf(ANSWERS.languages.values).join(',')];

      expect([target, [...new Set(chosen)]]).toEqual([target, expected]);
    }
  });

  it('runs a regional language on an SSR, a compiled and a library-free target', () => {
    for (const target of [
      'next',
      'nuxt',
      'svelte',
      'angular',
      'astro',
    ] as const) {
      const regional = pairedCases(target)
        .some(({ answers }) => {
          return answers.languages?.includes('zh-TW') === true;
        });

      expect([target, regional]).toEqual([target, true]);
    }
  });

  it('enumerates only answers the CLI accepts', () => {
    for (const { label, answers } of everyTargetsCases()
      .map((item) => {
        return {
          label: JSON.stringify(item.answers),
          answers: item.answers,
        };
      })) {
      expect([label, accepts(answers)]).toEqual([label, true]);
    }
  });

  it('offers a form library exactly where the CLI accepts one', () => {
    for (const target of TARGET_IDS) {
      const cases = everyCase(target);
      const hosted = cases
        .map(({ answers }) => {
          return answers.hostedFramework;
        });

      const hosts = [...new Set(hosted)];

      for (const hostedFramework of hosts) {
        for (const form of valuesOf(ANSWERS.form.values)) {
          const accepted = accepts({
            ...DEFAULT_ANSWERS,
            target,
            ...(hostedFramework === undefined ? {} : { hostedFramework }),
            form,
          });
          const offered = cases
            .some(({ answers }) => {
              return answers.hostedFramework === hostedFramework && answers.form === form;
            });

          expect([
            target,
            hostedFramework,
            form,
            offered,
          ]).toEqual([
            target,
            hostedFramework,
            form,
            accepted,
          ]);
        }
      }
    }
  });

  it('leaves an unset answer out rather than setting it to undefined', () => {
    for (const { answers } of everyTargetsCases()) {
      const unset = Object.entries(answers)
        .filter(([, value]) => {
          return value === undefined;
        });

      expect(unset).toEqual([]);
    }
  });

  it('offers every value of every single-select axis, and none on each optional one', () => {
    const answered = everyTargetsCases()
      .map(({ answers }) => {
        return answers;
      });
    const seen = (read: (answers: Answers) => string | undefined): (string | undefined)[] => {
      return [...new Set(answered.map(read))]
        .toSorted((left, right) => {
          return (left ?? '').localeCompare(right ?? '');
        });
    };
    const all = (values: readonly string[], optional: boolean): (string | undefined)[] => {
      return [...(optional ? [undefined] : []), ...values]
        .toSorted((left, right) => {
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
    })).toEqual(['strict']);
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
    expect(seen(({ mocking }) => {
      return mocking;
    })).toEqual(all(valuesOf(ANSWERS.mocking.values), true));
  });

  it('carries every multi-select but libraries at its full value, and surfaces only where a target has them', () => {
    for (const { answers } of everyTargetsCases()) {
      const inOrder = valuesOf(ANSWERS.libraries.values)
        .filter((library) => {
          return answers.libraries.includes(library);
        });

      expect(answers.libraries).toEqual(inOrder);
      expect(answers.agents).toEqual(valuesOf(ANSWERS.agents.values));
      expect(answers.plugins).toEqual(valuesOf(ANSWERS.plugins.values));
      expect(answers.surfaces).toEqual(answers.target === 'webextension'
        ? valuesOf(ANSWERS.surfaces.values)
        : undefined);
    }
  });

  it('labels each case by every answer that can vary on its target', () => {
    for (const {
      label,
      answers,
      variant,
    } of TARGET_IDS.flatMap(pairedCases)) {
      const record = targetFor(answers);
      const expected = [
        answers.target,
        answers.packageManager,
        answers.testing,
        record.hostsBrowser === true ? answers.browser : undefined,
        record.hostsFramework === true ? `host-${answers.hostedFramework ?? 'none'}` : undefined,
        answers.form,
        answers.router,
        answers.store,
        answers.styling,
        answers.data,
        answers.mocking,
        answers.languages === undefined ? undefined : 'languages',
        answers.libraries.length === 0 ? 'no-libraries' : answers.libraries.join('+'),
        variant,
      ]
        .filter((part) => {
          return part !== undefined;
        });

      expect(label).toBe(expected.join(' '));
    }
  });

  it('varies the answers under pnpm alone, and runs the widest case once on every other manager', () => {
    const byLabel = (left: string, right: string): number => {
      return left.localeCompare(right);
    };
    const asPnpm = ({ answers }: E2eCase): string => {
      const onPnpm = {
        ...answers,
        packageManager: 'pnpm',
      };

      return JSON.stringify(onPnpm);
    };
    const otherManagers = valuesOf(ANSWERS.packageManager.values)
      .filter((pm) => {
        return pm !== 'pnpm';
      })
      .toSorted(byLabel);
    const allLibraries = valuesOf(ANSWERS.libraries.values);

    for (const target of TARGET_IDS) {
      const counts = everyCase(target)
        .map(({ answers }) => {
          return Object.keys(answers).length;
        });
      const widest = Math.max(...counts);
      const others = pairedCases(target)
        .filter(({ answers }) => {
          return answers.packageManager !== 'pnpm';
        });
      const managers = others
        .map(({ answers }) => {
          return answers.packageManager;
        })
        .toSorted(byLabel);
      const shapes = new Set(others.map(asPnpm));
      const [smoke] = others;
      const answered = smoke === undefined ? 0 : Object.keys(smoke.answers).length;
      const ranOn = [target, managers];
      const expected = [target, otherManagers];

      expect(ranOn).toEqual(expected);
      expect(shapes.size).toBe(1);
      expect(answered).toBe(widest);
      expect(smoke?.answers.libraries).toEqual(allLibraries);
      expect(smoke?.variant).toBeUndefined();
    }
  });

  it('runs the browser pass on every target a browser serves, and each create flag once', () => {
    const byLabel = (left: string, right: string): number => {
      return left.localeCompare(right);
    };
    const variants = TARGET_IDS
      .flatMap(pairedCases)
      .filter(({ variant }) => {
        return variant !== undefined;
      })
      .map(({ answers, variant }) => {
        return `${answers.target} ${answers.packageManager} ${String(variant)}`;
      })
      .toSorted(byLabel);
    const browsed = TARGET_IDS
      .filter((target) => {
        return target !== 'webextension' && target !== 'react-native';
      })
      .map((target) => {
        return `${target} pnpm browser`;
      });
    const expected = [
      ...browsed,
      'react pnpm no-install',
      'react pnpm skip-fix',
    ];
    const sorted = expected.toSorted(byLabel);

    expect(variants).toEqual(sorted);
  });

  it('runs every target on every package manager', () => {
    for (const target of TARGET_IDS) {
      const ran = pairedCases(target)
        .map((item) => {
          return item.answers.packageManager;
        });

      const managers = new Set(ran);

      expect([target, [...managers]
        .sort((left, right) => {
          return left.localeCompare(right);
        })]).toEqual([target, valuesOf(ANSWERS.packageManager.values)
        .toSorted((left, right) => {
          return left.localeCompare(right);
        })]);
    }
  });

  it('gives every case its own label, which names the directory it runs in', () => {
    const labels = TARGET_IDS
      .flatMap((target) => {
        return pairedCases(target)
          .map((item) => {
            return item.label;
          });
      });

    expect(new Set(labels).size).toBe(labels.length);
  });

  it('runs one pnpm case per target and router under the typed lint, answering as much as any case can', () => {
    for (const target of TARGET_IDS) {
      const routers = targetFor({
        ...DEFAULT_ANSWERS,
        target,
      }).routers ?? [undefined];

      vi.stubEnv('E2E_TYPED_LINT', '1');

      const typed = targetCases(target);

      vi.unstubAllEnvs();

      const typedRouters = typed
        .map(({ answers }) => {
          return answers.router;
        });

      expect(typedRouters).toEqual(routers);

      for (const { answers } of typed) {
        const widestCount = everyCase(target)
          .filter((item) => {
            return item.answers.router === answers.router;
          })
          .reduce((widest, item) => {
            return Math.max(widest, Object.keys(item.answers).length);
          }, 0);

        expect(answers).toMatchObject({
          packageManager: 'pnpm',
          testing: 'vitest',
          typeSafety: 'strict',
          languages: valuesOf(ANSWERS.languages.values),
        });

        const answeredCount = Object.keys(answers).length;

        expect(answeredCount).toBe(widestCount);
      }
    }
  });

  it('is stable, so a label names the same case twice running', () => {
    for (const target of TARGET_IDS) {
      const firstLabels = pairedCases(target)
        .map((item) => {
          return item.label;
        });

      const secondLabels = targetCases(target)
        .map((item) => {
          return item.label;
        });

      expect(firstLabels).toEqual(secondLabels);
    }
  });
});
