import { env } from 'node:process';

import { memoize, orderBy } from 'es-toolkit';

import {
  type Answers,
  type HostedFramework,
  type Library,
  type PackageManager,
  type Router,
  type TargetId,
} from '@config/types';

import {
  type AnswerRecord,
  ANSWERS,
  DEFAULT_ANSWERS,
  onlyFor,
} from '@answers';
import { targetFor, type TargetRecord } from '@targets';

import {
  AGENTS,
  BROWSERS,
  DATA_CHOICES,
  FORMS,
  HOSTED_FRAMEWORKS,
  LANGUAGES,
  LIBRARIES,
  MOCKING_CHOICES,
  NO_BROWSER_PASS,
  PACKAGE_MANAGERS,
  PLUGINS,
  STYLING_CHOICES,
  SURFACES,
  TESTING_CHOICES,
} from './constants';
import { coveringSubset } from './utils/pairwiseUtils';

// A run other than create, install and `check`: `browser` loads the built starter afterwards, `monorepo` writes
// the target under apps/ and commits through the hooks, `add` runs `sync --add` on that monorepo.
export type E2eVariant = 'browser' | 'skip-fix' | 'no-install' | 'monorepo' | 'add';

export interface E2eCase {
  label: string;
  answers: Answers;
  variant?: E2eVariant;
}

// Every pair rather than every combination, under pnpm alone: every defect found so far was a two-way interaction.
// `E2E_FULL=1` runs the cross product instead.

// Each library on and off, the full set first, so the widest case carries every one.
const withAndWithout = (sets: Library[][], library: Library): Library[][] => {
  const withIt = sets
    .map((set) => {
      const grown = [...set, library];

      return grown;
    });
  const both = [...withIt, ...sets];

  return both;
};

const NO_LIBRARIES: Library[][] = [[]];

const LIBRARY_SETS = LIBRARIES.reduce(withAndWithout, NO_LIBRARIES);

// pnpm and strict alone, and every multi-select but the libraries at its full value.
const fixedAnswers = (target: TargetId): Partial<Answers> => {
  const fixed: Partial<Answers> = {
    packageManager: 'pnpm',
    typeSafety: 'strict',
    agents: [...AGENTS],
    plugins: [...PLUGINS],
    // Refused on a target that has no surfaces to name.
    ...(target === 'webextension' ? { surfaces: [...SURFACES] } : {}),
  };

  return fixed;
};

const recordFor = (target: TargetId, variant: Partial<Answers>): TargetRecord => {
  return targetFor({
    ...DEFAULT_ANSWERS,
    ...variant,
    target,
  });
};

// Through the predicate the prompt and parser use, so the matrix cannot enumerate a refused combination.
const offered = <V extends string>(
  values: readonly V[],
  record: AnswerRecord,
  target: TargetRecord,
  answered: Answers,
): (V | undefined)[] => {
  if (record.slot?.(target) === false) {
    const unasked = [undefined];

    return unasked;
  }

  const choices = [undefined, ...values
    .filter((value) => {
      const only = onlyFor(record, value);

      return only === undefined || only(target, answered);
    })];

  return choices;
};

const hostedFor = (record: TargetRecord): (HostedFramework | undefined)[] => {
  const frameworks = record.hostsFramework === true ? [undefined, ...HOSTED_FRAMEWORKS] : [undefined];

  return frameworks;
};

const routersFor = (record: TargetRecord): (Router | undefined)[] => {
  const routers = [undefined, ...record.routers ?? []];

  return routers;
};

// A hosted framework decides both the form libraries and the naming, so the axis reads the variant.
const across = <T>(
  variants: Partial<Answers>[],
  valuesFor: (variant: Partial<Answers>) => T[],
  apply: (variant: Partial<Answers>, value: T) => Partial<Answers>,
): Partial<Answers>[] => {
  return variants
    .flatMap((variant) => {
      return valuesFor(variant)
        .map((value) => {
          return apply(variant, value);
        });
    });
};

// The host flags are constant per target, so its record is built once rather than per case.
const hostRecordOf = memoize((target: TargetId): TargetRecord => {
  return recordFor(target, {});
});

// Every varying axis, so two cases never share a label or directory.
const labelFor = (answers: Answers): string => {
  const record = hostRecordOf(answers.target);
  const label = [
    answers.target,
    answers.packageManager,
    answers.testing,
    ...(record.hostsBrowser === true ? [answers.browser] : []),
    ...(record.hostsFramework === true ? [`host-${answers.hostedFramework ?? 'none'}`] : []),
    ...(answers.form === undefined ? [] : [answers.form]),
    ...(answers.router === undefined ? [] : [answers.router]),
    ...(answers.store === undefined ? [] : [answers.store]),
    ...(answers.styling === undefined ? [] : [answers.styling]),
    ...(answers.data === undefined ? [] : [answers.data]),
    ...(answers.mocking === undefined ? [] : [answers.mocking]),
    ...(answers.languages === undefined ? [] : ['languages']),
    answers.libraries.length === 0 ? 'no-libraries' : answers.libraries.join('+'),
  ].join(' ');

  return label;
};

const asCase = (answers: Answers): E2eCase => {
  const e2eCase: E2eCase = {
    label: labelFor(answers),
    answers,
  };

  return e2eCase;
};

export const everyCase = (target: TargetId): E2eCase[] => {
  const recordOf = (variant: Partial<Answers>): TargetRecord => {
    return recordFor(target, variant);
  };

  const hosted = across([{}], () => {
    const record = recordOf({});

    return hostedFor(record);
  }, (variant, hostedFramework) => {
    const withHost: Partial<Answers> = {
      ...variant,
      ...(hostedFramework === undefined ? {} : { hostedFramework }),
    };

    return withHost;
  });

  const browsers = across(hosted, (variant) => {
    const choices = recordOf(variant).hostsBrowser === true ? [...BROWSERS] : [DEFAULT_ANSWERS.browser];

    return choices;
  }, (variant, browser) => {
    const withBrowser: Partial<Answers> = {
      ...variant,
      browser,
    };

    return withBrowser;
  });

  const stylings = across(browsers, (variant) => {
    const record = recordOf(variant);

    return offered(STYLING_CHOICES, ANSWERS.styling, record, DEFAULT_ANSWERS);
  }, (variant, styling) => {
    const withStyling: Partial<Answers> = {
      ...variant,
      ...(styling === undefined ? {} : { styling }),
    };

    return withStyling;
  });

  const forms = across(stylings, (variant) => {
    const record = recordOf(variant);

    return offered(FORMS, ANSWERS.form, record, DEFAULT_ANSWERS);
  }, (variant, form) => {
    const withForm: Partial<Answers> = {
      ...variant,
      ...(form === undefined ? {} : { form }),
    };

    return withForm;
  });

  const routers = across(forms, (variant) => {
    const record = recordOf(variant);

    return routersFor(record);
  }, (variant, router) => {
    const withRouter: Partial<Answers> = {
      ...variant,
      ...(router === undefined ? {} : { router }),
    };

    return withRouter;
  });

  const stores = across(routers, (variant) => {
    const record = recordOf(variant);
    const choices = [undefined, ...record.stores ?? []];

    return choices;
  }, (variant, store) => {
    const withStore: Partial<Answers> = {
      ...variant,
      ...(store === undefined ? {} : { store }),
    };

    return withStore;
  });

  const datas = across(stores, (variant) => {
    const record = recordOf(variant);

    return offered(DATA_CHOICES, ANSWERS.data, record, {
      ...DEFAULT_ANSWERS,
      ...variant,
    });
  }, (variant, data) => {
    const withData: Partial<Answers> = {
      ...variant,
      ...(data === undefined ? {} : { data }),
    };

    return withData;
  });

  const mockings = across(datas, (variant) => {
    const record = recordOf(variant);

    return offered(MOCKING_CHOICES, ANSWERS.mocking, record, {
      ...DEFAULT_ANSWERS,
      ...variant,
    });
  }, (variant, mocking) => {
    const withMocking: Partial<Answers> = {
      ...variant,
      ...(mocking === undefined ? {} : { mocking }),
    };

    return withMocking;
  });

  // The full set holds both zh tags, so only an exact-tag match resolves zh-TW.
  const languages = across(mockings, (variant) => {
    const record = recordOf(variant);
    const asks = ANSWERS.languages.slot(record);
    const choices = asks ? [undefined, LANGUAGES] : [undefined];

    return choices;
  }, (variant, chosen) => {
    const withLanguages: Partial<Answers> = {
      ...variant,
      ...(chosen === undefined ? {} : { languages: [...chosen] }),
    };

    return withLanguages;
  });

  const libraries = across(languages, () => {
    return LIBRARY_SETS;
  }, (variant, set) => {
    const chosen = {
      ...variant,
      libraries: [...set],
    };

    return chosen;
  });

  return across(libraries, () => {
    const testings = [...TESTING_CHOICES];

    return testings;
  }, (variant, testing) => {
    const tested = {
      ...variant,
      testing,
    };

    return tested;
  })
    .map((variant) => {
      return asCase({
        ...DEFAULT_ANSWERS,
        ...fixedAnswers(target),
        ...variant,
        target,
      });
    });
};

const answerCount = ({ answers }: E2eCase): number => {
  return Object.keys(answers).length;
};

const onMonorepo = (widest: E2eCase) => {
  return (packageManager: PackageManager): E2eCase => {
    const { answers, label } = asCase({
      ...widest.answers,
      packageManager,
      layout: 'monorepo',
    });
    const monorepo: E2eCase = {
      label: `${label} monorepo`,
      answers,
      variant: 'monorepo',
    };

    return monorepo;
  };
};

// The first case answering the most, as one smoke per other manager and the browser pass under pnpm.
const fullCases = (target: TargetId, widest: E2eCase): E2eCase[] => {
  const onManager = (packageManager: PackageManager): E2eCase => {
    const answers = {
      ...widest.answers,
      packageManager,
    };

    return asCase(answers);
  };

  const smokes = PACKAGE_MANAGERS
    .filter((pm) => {
      return pm !== 'pnpm';
    })
    .map(onManager);
  const variants: E2eVariant[] = [];

  if (!NO_BROWSER_PASS.has(target)) {
    variants.push('browser');
  }

  if (target === 'react') {
    variants.push('skip-fix', 'no-install');
  }

  const asVariant = (variant: E2eVariant): E2eCase => {
    const labelled = {
      ...widest,
      label: `${widest.label} ${variant}`,
      variant,
    };

    return labelled;
  };

  const varied = variants.map(asVariant);
  const monorepos = target === 'react' ? PACKAGE_MANAGERS.map(onMonorepo(widest)) : [];
  const added = monorepos
    .filter(({ answers }) => {
      return answers.packageManager === 'pnpm';
    })
    .map((monorepo) => {
      const add: E2eCase = {
        ...monorepo,
        label: `${widest.label} add`,
        variant: 'add',
      };

      return add;
    });
  const extra = [
    ...smokes,
    ...varied,
    ...monorepos,
    ...added,
  ];

  return extra;
};

export const targetCases = (target: TargetId): E2eCase[] => {
  const every = everyCase(target);

  const paired = env['E2E_FULL'] === '1' ? every : coveringSubset(every);

  // Stable, so a tie keeps the first.
  const widest = orderBy(every, [answerCount], ['desc'])
    .slice(0, 1);
  const extra = widest
    .flatMap((item) => {
      return fullCases(target, item);
    });
  // Framework mode server-renders where the widest React case does not, so it gets a browser pass of its own.
  const frameworkCases = every
    .filter(({ answers }) => {
      return answers.router === 'react-router-framework';
    });
  const framework = orderBy(frameworkCases, [answerCount], ['desc'])
    .slice(0, 1)
    .map(({ answers }): E2eCase => {
      const onNpm = asCase({
        ...answers,
        packageManager: 'npm',
      });
      const browsed: E2eCase = {
        ...onNpm,
        label: `${onNpm.label} browser`,
        variant: 'browser',
      };

      return browsed;
    });
  const cases = [
    ...paired,
    ...extra,
    ...framework,
  ];

  return cases;
};
