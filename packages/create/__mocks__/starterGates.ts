import { isDeepStrictEqual } from 'node:util';

import { answersFor } from '@mocks/answersFor';

import { LANGUAGES } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';
import {
  type StarterFile,
  type StarterTest,
  type TargetBuilder,
  type TargetRecord,
} from '@targets';

import type { Answers, TargetId } from '@config/types';

export type Condition = {
  readonly [K in keyof Answers]?: typeof ANSWERED | readonly Answers[K][];
};

export type GateRow = readonly [key: string, conditions: readonly Condition[]];

export interface GateWalk {
  gated: string[];
  twice: string[];
  mismatchOf: (key: string, conditions: readonly Condition[]) => string | undefined;
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

  return [
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
          return [`src/lib/apis/contact/${stem}.ts@rtk-query`, [{
            form: ANSWERED,
            data: ['rtk-query'],
          }]];
        })
    : [];

  return [
    ['src/lib/apis/contact/index.ts', hasRtkQuery
      ? [{
          form: ANSWERED,
          data: [undefined, ...wrapped],
        }]
      : WITH_FORM],
    ...rtkQuery,
    ['src/lib/apis/contact/contactApi.ts', [{
      form: ANSWERED,
      data: [undefined],
    }]],
    ...wrapped
      .map((data): GateRow => {
        return [`src/lib/apis/contact/contactApi.ts@${data}`, [{
          form: ANSWERED,
          data: [data],
        }]];
      }),
    ['src/lib/apis/contact/schemas.ts', [{
      form: ANSWERED,
      libraries: [[]],
    }]],
    ['src/lib/apis/contact/schemas.ts@zod', [{
      form: ANSWERED,
      libraries: [['zod']],
    }]],
  ];
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
        return {
          ...condition,
          styling,
        };
      });
  };

  return [
    ...components
      .map(([path, ships]): GateRow => {
        return [`${path}.css`, under(ships, [undefined, 'tailwind'])];
      }),
    ...modules
      ? [
          ...components
            .flatMap(([path, ships]): GateRow[] => {
              const styles = `${path.slice(0, path.lastIndexOf('/'))}/styles.ts`;

              return [
                [styles, under(ships, [undefined, 'tailwind'])],
                [`${styles}@stylex`, under(ships, ['stylex'])],
              ];
            }),
          ['src/styles/tokens.stylex.ts@stylex', STYLEX] as const,
        ]
      : [],
  ];
};

const answered = <K extends keyof Answers>(key: K, values: Answers[K][], unanswered = true): Partial<Answers>[] => {
  return [
    ...unanswered ? [{}] : [],
    ...values
      .map((value): Partial<Answers> => {
        return { [key]: value };
      }),
  ];
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
  const axes: Partial<Answers>[][] = [
    answered('store', [...stores]),
    answered('form', valuesOf(ANSWERS.form.values)),
    answered('data', valuesOf(ANSWERS.data.values)),
    answered('router', [...routers]),
    answered('styling', valuesOf(ANSWERS.styling.values)),
    answered('mocking', valuesOf(ANSWERS.mocking.values)),
    answered('libraries', [[], ['zod']], false),
    answered('testing', valuesOf(ANSWERS.testing.values), false),
    ...i18n === undefined ? [] : [answered('languages', [[...LANGUAGES]])],
    ...hostsFramework === true ? [answered('hostedFramework', valuesOf(ANSWERS.hostedFramework.values))] : [],
    ...hostsBrowser === true
      ? [
          answered('browser', valuesOf(ANSWERS.browser.values), false),
          answered('surfaces', [[], ...valuesOf(ANSWERS.surfaces.values)
            .map((surface) => {
              return [surface];
            })]),
        ]
      : [],
  ];

  return axes
    .reduce<Answers[]>((sets, overrides) => {
      return sets
        .flatMap((answers) => {
          return overrides
            .map((override): Answers => {
              return {
                ...answers,
                ...override,
              };
            });
        });
    }, [base]);
};

const keyOf = (path: string, variant: string | undefined): string => {
  return variant === undefined ? path : `${path}@${variant}`;
};

const gatesOf = (record: TargetRecord): Map<string, Gate> => {
  const gates = new Map<string, Gate>();
  const entries: [string, Gate | undefined][] = [
    ...[...record.starterFiles, ...record.starterTests]
      .map(({
        target,
        variant,
        when,
      }): [string, Gate | undefined] => {
        return [keyOf(target, variant), when];
      }),
    ...(record.starterStyles ?? [])
      .map((style): [string, Gate | undefined] => {
        return typeof style === 'string' ? [style, undefined] : [style.path, style.when];
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
  return [
    ...record.starterFiles,
    ...answers.testing === 'none' ? [] : record.starterTests,
  ]
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

  return JSON.stringify(Object.fromEntries(onAxes));
};

export const walkGates = (builder: TargetBuilder, target: TargetId): GateWalk => {
  const walked = answerSets(builder, target)
    .map((answers) => {
      const record = builder(answers);

      return {
        answers,
        record,
        gates: gatesOf(record),
      };
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
      return [...gates.keys()];
    });

  return {
    gated: [...new Set(gatedPaths)]
      .toSorted((left, right) => {
        return left.localeCompare(right);
      }),
    twice: [...twice],
    mismatchOf: (key, conditions) => {
      for (const { answers, gates } of walked) {
        const actual = gates.get(key)?.(answers) ?? false;

        if (actual !== holds(conditions, answers)) {
          return `${actual ? 'written' : 'not written'} under ${describeAnswers(answers)}`;
        }
      }

      return undefined;
    },
  };
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
