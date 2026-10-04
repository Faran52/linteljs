import { isDeepStrictEqual } from 'node:util';

import { LANGUAGES } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';
import {
  type StarterFile,
  type StarterTest,
  type TargetBuilder,
  type TargetRecord,
} from '@targets';

import { answersFor } from './answersFor';

import type { Answers, TargetId } from '@config/types';

export type Condition = {
  readonly [K in keyof Answers]?: typeof ANSWERED | readonly Answers[K][];
};

export type GateRow = readonly [key: string, conditions: readonly Condition[]];

export interface GateWalk {
  gated: string[];
  twice: string[];
  mismatchesOf: (rows: readonly GateRow[]) => string[];
}

type Gate = (answers: Answers) => boolean;

export const ANSWERED = 'answered';

const AXES = new Set<string>([
  'store',
  'form',
  'data',
  'router',
  'styling',
  'mocking',
  'libraries',
  'testing',
  'hostedFramework',
  'browser',
  'surfaces',
  'languages',
]);

export const WITH_FORM: readonly Condition[] = [{ form: ANSWERED }];
export const WITHOUT_FORM: readonly Condition[] = [{ form: [undefined] }];
export const WITH_I18N: readonly Condition[] = [{ languages: ANSWERED }];
export const WITHOUT_I18N: readonly Condition[] = [{ languages: [undefined] }];
export const WITH_STORE: readonly Condition[] = [{ store: ANSWERED }];
export const WITHOUT_STORE: readonly Condition[] = [{ store: [undefined] }];
export const TANSTACK_QUERY: readonly Condition[] = [{ data: ['tanstack-query'] }];
export const NOT_TANSTACK_QUERY: readonly Condition[] = [{ data: [undefined, 'rtk-query'] }];
export const RTK_QUERY: readonly Condition[] = [{ data: ['rtk-query'] }];
export const TAILWIND: readonly Condition[] = [{ styling: ['tailwind'] }];
export const STYLEX: readonly Condition[] = [{ styling: ['stylex'] }];

// A home page that has a store variant, each shipped in English and translated.
export const homeGates = (target: string): GateRow[] => {
  const gates: GateRow[] = [
    [target, [{
      store: [undefined],
      languages: [undefined],
    }]],
    [`${target}@i18n`, [{
      store: [undefined],
      languages: ANSWERED,
    }]],
    [`${target}@with-store`, [{
      store: ANSWERED,
      languages: [undefined],
    }]],
    [`${target}@with-store-i18n`, [{
      store: ANSWERED,
      languages: ANSWERED,
    }]],
  ];

  return gates;
};

export const mswGates = (contact: boolean, servesAWorker = true): GateRow[] => {
  const msw: readonly Condition[] = [{ mocking: ['msw'] }];
  const bare: readonly Condition[] = [{
    mocking: ['msw'],
    form: [undefined],
  }];
  const withForm: readonly Condition[] = [{
    mocking: ['msw'],
    form: ANSWERED,
  }];

  const gates: GateRow[] = [
    ...servesAWorker ? [['__mocks__/msw/browser.ts', msw] as const] : [],
    ['__mocks__/msw/node.ts', msw],
    ...contact
      ? [
          ['__mocks__/msw/handlers.ts', bare],
          ['__mocks__/msw/handlers.ts@with-form', withForm],
          ['__mocks__/msw/handlers.test.ts', bare],
          ['__mocks__/msw/handlers.test.ts@with-form', withForm],
        ] as const
      : [
          ['__mocks__/msw/handlers.ts', msw],
          ['__mocks__/msw/handlers.test.ts', msw],
        ] as const,
  ];

  return gates;
};

// RTK Query splits the module into endpoints and hooks, with its own barrel.
export const contactGates = (dataLayers: readonly NonNullable<Answers['data']>[]): GateRow[] => {
  const wrapped = dataLayers
    .filter((data) => {
      return data !== 'rtk-query';
    });
  const hasRtkQuery = dataLayers.includes('rtk-query');
  const rtkQuery = hasRtkQuery
    ? [
        'index',
        'contactEndpoints',
        'contactHooks',
      ]
        .map((stem): GateRow => {
          const row: GateRow = [`src/lib/apis/contact/${stem}.ts@rtk-query`, [{
            form: ANSWERED,
            data: ['rtk-query'],
          }]];

          return row;
        })
    : [];

  const gates: GateRow[] = [
    // Never under RTK Query, which keeps its own barrel.
    ['src/lib/apis/contact/index.ts', [{
      form: ANSWERED,
      data: [undefined, ...wrapped],
    }]],
    ...rtkQuery,
    ['src/lib/apis/contact/contactApi.ts', [{
      form: ANSWERED,
      data: [undefined],
    }]],
    ...wrapped
      .map((data): GateRow => {
        const row: GateRow = [`src/lib/apis/contact/contactApi.ts@${data}`, [{
          form: ANSWERED,
          data: [data],
        }]];

        return row;
      }),
    ['src/lib/apis/contact/submission.ts', [{
      form: ANSWERED,
      data: [undefined, ...wrapped],
    }]],
    ['src/lib/apis/contact/schemas.ts', [{
      form: ANSWERED,
      libraries: [[]],
    }]],
    ['src/lib/apis/contact/schemas.ts@zod', [{
      form: ANSWERED,
      libraries: [['zod']],
    }]],
  ];

  return gates;
};

export const componentStyleGates = (mark: string, button: string, modules: boolean): GateRow[] => {
  const components: [string, readonly Condition[]][] = [
    ['src/components/features/app-header/AppHeader', [{}]],
    [`src/components/ui/${mark}`, [{}]],
    [`src/components/ui/${button}`, [{}]],
    ['src/components/ui/text-input/TextInput', WITH_FORM],
  ];

  const under = (ships: readonly Condition[], styling: NonNullable<Condition['styling']>): Condition[] => {
    return ships
      .map((condition) => {
        const styled = {
          ...condition,
          styling,
        };

        return styled;
      });
  };

  const gates: GateRow[] = [
    ...components
      .map(([path, ships]): GateRow => {
        const row: GateRow = [`${path}.css`, under(ships, [undefined, 'tailwind'])];

        return row;
      }),
    ...modules
      ? [
          ...components
            .flatMap(([path, ships]): GateRow[] => {
              const directory = path.slice(0, path.lastIndexOf('/'));
              const styles = `${directory}/styles.ts`;
              const rows: GateRow[] = [
                [styles, under(ships, [undefined, 'tailwind'])],
                [`${styles}@stylex`, under(ships, ['stylex'])],
              ];

              return rows;
            }),
          ['src/styles/tokens.stylex.ts@stylex', STYLEX] as const,
        ]
      : [],
  ];

  return gates;
};

const answered = <K extends keyof Answers>(key: K, values: Answers[K][], unanswered = true): Partial<Answers>[] => {
  const sets: Partial<Answers>[] = [
    ...unanswered ? [{}] : [],
    ...values
      .map((value): Partial<Answers> => {
        const answer: Partial<Answers> = { [key]: value };

        return answer;
      }),
  ];

  return sets;
};

const answerSets = (builder: TargetBuilder, target: TargetId): Answers[] => {
  const base: Answers = {
    ...DEFAULT_ANSWERS,
    target,
  };
  const {
    hostsBrowser,
    hostsFramework,
    i18n,
    routers = [],
    stores = [],
  } = builder(base);
  const forms = valuesOf(ANSWERS.form.values);
  const dataLayers = valuesOf(ANSWERS.data.values);
  const stylings = valuesOf(ANSWERS.styling.values);
  const mockings = valuesOf(ANSWERS.mocking.values);
  const testings = valuesOf(ANSWERS.testing.values);
  const hostedFrameworks = valuesOf(ANSWERS.hostedFramework.values);
  const browsers = valuesOf(ANSWERS.browser.values);
  const surfaceAnswers = valuesOf(ANSWERS.surfaces.values)
    .map((surface) => {
      const answer = [surface];

      return answer;
    });
  const axes: Partial<Answers>[][] = [
    answered('store', [...stores]),
    answered('form', forms),
    answered('data', dataLayers),
    answered('router', [...routers]),
    answered('styling', stylings),
    answered('mocking', mockings),
    answered('libraries', [[], ['zod']], false),
    answered('testing', testings, false),
    ...i18n === undefined ? [] : [answered('languages', [[...LANGUAGES]])],
    ...hostsFramework === true ? [answered('hostedFramework', hostedFrameworks)] : [],
    ...hostsBrowser === true
      ? [
          answered('browser', browsers, false),
          answered('surfaces', [[], ...surfaceAnswers]),
        ]
      : [],
  ];

  return axes
    .reduce<Answers[]>((sets, overrides) => {
      return sets
        .flatMap((answers) => {
          return overrides
            .map((override): Answers => {
              const combined: Answers = {
                ...answers,
                ...override,
              };

              return combined;
            });
        });
    }, [base]);
};

const keyOf = (path: string, variant: string | undefined): string => {
  return variant === undefined ? path : `${path}@${variant}`;
};

const gatesOf = (record: TargetRecord): Map<string, Gate> => {
  const gates = new Map<string, Gate>();
  const starterEntries = [...record.starterFiles, ...record.starterTests];
  const entries: [string, Gate | undefined][] = [
    ...starterEntries
      .map(({
        target,
        variant,
        when,
      }): [string, Gate | undefined] => {
        const key = keyOf(target, variant);
        const entry: [string, Gate | undefined] = [key, when];

        return entry;
      }),
    ...(record.starterStyles ?? [])
      .map((style): [string, Gate | undefined] => {
        const entry: [string, Gate | undefined] = typeof style === 'string'
          ? [style, undefined]
          : [style.path, style.when];

        return entry;
      }),
  ];

  for (const [key, when] of entries) {
    const other = gates.get(key);

    if (when !== undefined) {
      gates.set(key, other === undefined
        ? when
        : (answers) => {
            return other(answers) || when(answers);
          });
    }
  }

  return gates;
};

const writtenBy = (record: TargetRecord, answers: Answers): string[] => {
  const candidates = [
    ...record.starterFiles,
    ...answers.testing === 'none' ? [] : record.starterTests,
  ];

  return candidates
    .filter((file) => {
      return file.when === undefined || file.when(answers);
    })
    .map((file) => {
      return file.target;
    });
};

const holds = (conditions: readonly Condition[], answers: Answers): boolean => {
  const given = new Map<string, unknown>(Object.entries(answers));

  return conditions
    .some((condition) => {
      return Object.entries(condition)
        .every(([key, allowed]) => {
          const value = given.get(key);

          return allowed === ANSWERED
            ? value !== undefined
            : allowed
                .some((option) => {
                  return isDeepStrictEqual(option, value);
                });
        });
    });
};

const describeAnswers = (answers: Answers): string => {
  const onAxes = Object.entries(answers)
    .filter(([key, value]) => {
      return AXES.has(key) && value !== undefined;
    });

  const axisAnswers = Object.fromEntries(onAxes);

  return JSON.stringify(axisAnswers);
};

export const walkGates = (builder: TargetBuilder, target: TargetId): GateWalk => {
  const walked = answerSets(builder, target)
    .map((answers) => {
      const record = builder(answers);

      const visited = {
        answers,
        record,
        gates: gatesOf(record),
      };

      return visited;
    });
  const twice = new Set<string>();

  for (const { answers, record } of walked) {
    const written = writtenBy(record, answers);

    for (const [index, path] of written.entries()) {
      if (written.indexOf(path) !== index) {
        twice.add(path);
      }
    }
  }

  const gatedPaths = walked
    .flatMap(({ gates }) => {
      const keys = [...gates.keys()];

      return keys;
    });

  const gated = [...new Set(gatedPaths)]
    .toSorted((left, right) => {
      return left.localeCompare(right);
    });
  const walk: GateWalk = {
    gated,
    twice: [...twice],
    mismatchesOf: (rows) => {
      const lines: string[] = [];

      for (const [key, conditions] of rows) {
        const mismatch = walked
          .find(({ answers, gates }) => {
            const actual = gates.get(key)?.(answers) ?? false;

            return actual !== holds(conditions, answers);
          });

        if (mismatch !== undefined) {
          const written = mismatch.gates.get(key)?.(mismatch.answers) ?? false;
          lines.push(`${key} ${written ? 'written' : 'not written'} under ${describeAnswers(mismatch.answers)}`);
        }
      }

      return lines;
    },
  };

  return walk;
};

export const pickedBy = (entries: (StarterFile | StarterTest)[], overrides: Partial<Answers> = {}): string[] => {
  const answers = answersFor(overrides);

  return entries
    .filter((entry) => {
      return entry.when === undefined || entry.when(answers);
    })
    .map((entry) => {
      return `${entry.target} ${entry.variant ?? 'base'}`;
    });
};

export const byKey = (rows: readonly GateRow[]): string[] => {
  return rows
    .map(([key]) => {
      return key;
    })
    .toSorted((left, right) => {
      return left.localeCompare(right);
    });
};
