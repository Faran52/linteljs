import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { keysOf } from '@utils/objectUtils';

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

const TARGET_IDS = keysOf(ANSWERS.target.values);

const pairsOf = (answers: Answers): string[] => {
  const libraryFlags = keysOf(ANSWERS.libraries.values)
    .map((library): [string, string] => {
      const isChosen = answers.libraries.includes(library);
      const flag: [string, string] = [library, String(isChosen)];

      return flag;
    });
  const libraries = Object.fromEntries(libraryFlags);
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
    ...libraries,
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
      const everyPair = coveredBy(everyCase(target));
      const pairs = [...everyPair];
      const missing = pairs
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

    const astroHas = has('astro', (answers) => {
      return answers.hostedFramework === 'vue' && answers.data === 'tanstack-query';
    });
    expect(astroHas).toBe(true);

    const webextensionOnChrome = has('webextension', (answers) => {
      return answers.browser === 'chrome';
    });
    expect(webextensionOnChrome).toBe(true);

    const angularUntested = has('angular', (answers) => {
      return answers.testing === 'none';
    });
    expect(angularUntested).toBe(true);

    const reactNativeHas = has('react-native', (answers) => {
      return answers.testing === 'none';
    });
    expect(reactNativeHas).toBe(true);

    const reactHas = has('react', (answers) => {
      return answers.router === 'react-router-framework' && answers.styling === 'stylex';
    });
    expect(reactHas).toBe(true);

    const nextZustandTanstackForm = has('next', (answers) => {
      return answers.store === 'zustand' && answers.form === 'tanstack-form';
    });
    expect(nextZustandTanstackForm).toBe(true);

    const nextStylex = has('next', (answers) => {
      return answers.styling === 'stylex';
    });
    expect(nextStylex).toBe(true);

    const angularFormless = has('angular', (answers) => {
      return answers.form === undefined;
    });
    expect(angularFormless).toBe(true);

    const angularTanstackFormZod = has('angular', (answers) => {
      return answers.form === 'tanstack-form' && answers.libraries.includes('zod');
    });
    expect(angularTanstackFormZod).toBe(true);
  });

  it('offers no languages or every one on every target that asks', () => {
    for (const target of TARGET_IDS) {
      const chosen = everyCase(target)
        .map(({ answers }) => {
          return answers.languages?.join(',') ?? 'none';
        });
      const asks = ANSWERS.languages.slot(targetFor({
        ...DEFAULT_ANSWERS,
        target,
      }));
      const offered = asks ? ['none', keysOf(ANSWERS.languages.values).join(',')] : ['none'];

      const actual = [target, [...new Set(chosen)]];
      const expected = [target, offered];
      expect(actual).toEqual(expected);
    }
  });

  it('runs a regional language on an SSR, a compiled and a library-free target', () => {
    const regionalTargets = [
      'next',
      'nuxt',
      'svelte',
      'angular',
      'astro',
    ] as const;

    for (const target of regionalTargets) {
      const regional = pairedCases(target)
        .some(({ answers }) => {
          return answers.languages?.includes('zh-TW') === true;
        });

      const actual = [target, regional];
      const expected = [target, true];
      expect(actual).toEqual(expected);
    }
  });

  it('enumerates only answers the CLI accepts', () => {
    for (const { answers } of everyTargetsCases()) {
      const label = JSON.stringify(answers);
      const actual = [label, accepts(answers)];
      const expected = [label, true];
      expect(actual).toEqual(expected);
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
        for (const form of keysOf(ANSWERS.form.values)) {
          const candidate: Answers = {
            ...DEFAULT_ANSWERS,
            target,
            form,
          };

          if (hostedFramework !== undefined) {
            candidate.hostedFramework = hostedFramework;
          }

          const accepted = accepts(candidate);
          const offered = cases
            .some(({ answers }) => {
              return answers.hostedFramework === hostedFramework && answers.form === form;
            });

          const actual = [
            target,
            hostedFramework,
            form,
            offered,
          ];
          const expected = [
            target,
            hostedFramework,
            form,
            accepted,
          ];
          expect(actual).toEqual(expected);
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
      const distinct = new Set(answered.map(read));
      const values = [...distinct];

      return values
        .toSorted((left, right) => {
          return (left ?? '').localeCompare(right ?? '');
        });
    };

    const all = (values: readonly string[], optional: boolean): (string | undefined)[] => {
      const offered: (string | undefined)[] = [...values];

      if (optional) {
        offered.push(undefined);
      }

      return offered
        .toSorted((left, right) => {
          return (left ?? '').localeCompare(right ?? '');
        });
    };

    const managers = seen(({ packageManager }) => {
      return packageManager;
    });
    const everyManager = all(keysOf(ANSWERS.packageManager.values), false);
    expect(managers).toEqual(everyManager);

    const suites = seen(({ testing }) => {
      return testing;
    });
    const everySuite = all(keysOf(ANSWERS.testing.values), false);
    expect(suites).toEqual(everySuite);

    const typeSafeties = seen(({ typeSafety }) => {
      return typeSafety;
    });
    const expected = ['strict'];
    expect(typeSafeties).toEqual(expected);

    const browsers = seen(({ browser }) => {
      return browser;
    });
    const everyBrowser = all(keysOf(ANSWERS.browser.values), false);
    expect(browsers).toEqual(everyBrowser);

    const hostedFrameworks = seen(({ hostedFramework }) => {
      return hostedFramework;
    });
    const everyHostedFramework = all(keysOf(ANSWERS.hostedFramework.values), true);
    expect(hostedFrameworks).toEqual(everyHostedFramework);

    const stylings = seen(({ styling }) => {
      return styling;
    });
    const everyStyling = all(keysOf(ANSWERS.styling.values), true);
    expect(stylings).toEqual(everyStyling);

    const forms = seen(({ form }) => {
      return form;
    });
    const everyForm = all(keysOf(ANSWERS.form.values), true);
    expect(forms).toEqual(everyForm);

    const routers = seen(({ router }) => {
      return router;
    });
    const everyRouter = all(keysOf(ANSWERS.router.values), true);
    expect(routers).toEqual(everyRouter);

    const stores = seen(({ store }) => {
      return store;
    });
    const everyStore = all(keysOf(ANSWERS.store.values), true);
    expect(stores).toEqual(everyStore);

    const dataLayers = seen(({ data }) => {
      return data;
    });
    const everyDataLayer = all(keysOf(ANSWERS.data.values), true);
    expect(dataLayers).toEqual(everyDataLayer);

    const mockings = seen(({ mocking }) => {
      return mocking;
    });
    const everyMocking = all(keysOf(ANSWERS.mocking.values), true);
    expect(mockings).toEqual(everyMocking);
  });

  it('carries every multi-select but libraries at its full value, and surfaces only where a target has them', () => {
    for (const { answers } of everyTargetsCases()) {
      const inOrder = keysOf(ANSWERS.libraries.values)
        .filter((library) => {
          return answers.libraries.includes(library);
        });

      expect(answers.libraries).toEqual(inOrder);
      expect(answers.agents).toEqual(keysOf(ANSWERS.agents.values));
      expect(answers.plugins).toEqual(keysOf(ANSWERS.plugins.values));

      expect(answers.surfaces).toEqual(answers.target === 'webextension'
        ? keysOf(ANSWERS.surfaces.values)
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
      const parts = [
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
      ];
      const expected = parts
        .filter((part) => {
          return part !== undefined;
        })
        .join(' ');

      expect(label).toBe(expected);
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

    const otherManagers = keysOf(ANSWERS.packageManager.values)
      .filter((pm) => {
        return pm !== 'pnpm';
      })
      .toSorted(byLabel);
    const allLibraries = keysOf(ANSWERS.libraries.values);

    for (const target of TARGET_IDS) {
      const counts = everyCase(target)
        .map(({ answers }) => {
          return Object.keys(answers).length;
        });
      const widest = Math.max(...counts);
      const others = pairedCases(target)
        .filter(({ answers, variant }) => {
          return answers.packageManager !== 'pnpm' && variant === undefined;
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

  it('runs the widest react case as a monorepo on every manager', () => {
    const monorepos = pairedCases('react')
      .filter(({ variant }) => {
        return variant === 'monorepo';
      });
    const layouts = monorepos
      .map(({ answers }) => {
        return `${answers.packageManager} ${answers.layout} ${String(answers.libraries.length)}`;
      });
    const libraryCount = keysOf(ANSWERS.libraries.values).length;
    const expected = [
      'pnpm',
      'npm',
      'yarn',
      'bun',
    ]
      .map((pm) => {
        return `${pm} monorepo ${String(libraryCount)}`;
      });

    expect(layouts).toEqual(expected);
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
        return target !== 'webextension' && target !== 'react-native' && target !== 'typescript';
      })
      .map((target) => {
        return `${target} pnpm browser`;
      });
    const expected = [
      ...browsed,
      'react npm browser',
      'react pnpm add',
      'react bun monorepo',
      'react npm monorepo',
      'react pnpm monorepo',
      'react yarn monorepo',
      'react pnpm no-install',
      'react pnpm skip-fix',
    ];
    const sorted = expected.toSorted(byLabel);

    expect(variants).toEqual(sorted);
  });

  it('serves the widest framework-mode case, languages and every library on, in the browser on npm', () => {
    const framework = pairedCases('react')
      .filter(({ answers }) => {
        return answers.router === 'react-router-framework' && answers.packageManager === 'npm';
      });
    const shapes = framework
      .map(({ answers, variant }) => {
        const shape = {
          languages: answers.languages,
          libraries: answers.libraries,
          variant,
        };

        return shape;
      });
    const [first] = framework;
    const expected = [{
      languages: keysOf(ANSWERS.languages.values),
      libraries: keysOf(ANSWERS.libraries.values),
      variant: 'browser',
    }];

    expect(shapes).toEqual(expected);
    expect(first?.label).toMatch(/^react npm .*react-router-framework .*languages .* browser$/u);
  });

  it('runs every target on every package manager', () => {
    for (const target of TARGET_IDS) {
      const ran = pairedCases(target)
        .map((item) => {
          return item.answers.packageManager;
        });

      const managers = [...new Set(ran)];

      const actual = [target, managers
        .toSorted((left, right) => {
          return left.localeCompare(right);
        })];
      const expected = [target, keysOf(ANSWERS.packageManager.values)
        .toSorted((left, right) => {
          return left.localeCompare(right);
        })];
      expect(actual).toEqual(expected);
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
