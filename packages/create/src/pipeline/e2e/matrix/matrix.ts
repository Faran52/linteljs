import { env } from 'node:process';

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

// A run other than create, install and `check`: `browser` loads the built starter afterwards.
export type E2eVariant = 'browser' | 'skip-fix' | 'no-install';

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
  return {
    packageManager: 'pnpm',
    typeSafety: 'strict',
    agents: [...AGENTS],
    plugins: [...PLUGINS],
    // Refused on a target that has no surfaces to name.
    ...(target === 'webextension' ? { surfaces: [...SURFACES] } : {}),
  };
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
  return [undefined, ...values
    .filter((value) => {
      const only = onlyFor(record, value);

      return only === undefined || only(target, answered);
    })];
};

const hostedFor = (record: TargetRecord): (HostedFramework | undefined)[] => {
  return record.hostsFramework === true ? [undefined, ...HOSTED_FRAMEWORKS] : [undefined];
};

const routersFor = (record: TargetRecord): (Router | undefined)[] => {
  return [undefined, ...record.routers ?? []];
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

// Every varying axis, so two cases never share a label or directory.
const labelFor = (answers: Answers): string => {
  const record = targetFor(answers);

  return [
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
};

const asCase = (answers: Answers): E2eCase => {
  return {
    label: labelFor(answers),
    answers,
  };
};

const everyCase = (target: TargetId): E2eCase[] => {
  const recordOf = (variant: Partial<Answers>): TargetRecord => {
    return recordFor(target, variant);
  };

  const hosted = across([{}], () => {
    return hostedFor(recordOf({}));
  }, (variant, hostedFramework) => {
    return {
      ...variant,
      ...(hostedFramework === undefined ? {} : { hostedFramework }),
    };
  });

  const browsers = across(hosted, (variant) => {
    return recordOf(variant).hostsBrowser === true ? [...BROWSERS] : [DEFAULT_ANSWERS.browser];
  }, (variant, browser) => {
    return {
      ...variant,
      browser,
    };
  });

  const stylings = across(browsers, (variant) => {
    return offered(STYLING_CHOICES, ANSWERS.styling, recordOf(variant), DEFAULT_ANSWERS);
  }, (variant, styling) => {
    return {
      ...variant,
      ...(styling === undefined ? {} : { styling }),
    };
  });

  const forms = across(stylings, (variant) => {
    return offered(FORMS, ANSWERS.form, recordOf(variant), DEFAULT_ANSWERS);
  }, (variant, form) => {
    return {
      ...variant,
      ...(form === undefined ? {} : { form }),
    };
  });

  const routers = across(forms, (variant) => {
    return routersFor(recordOf(variant));
  }, (variant, router) => {
    return {
      ...variant,
      ...(router === undefined ? {} : { router }),
    };
  });

  const stores = across(routers, (variant) => {
    return [undefined, ...recordOf(variant).stores ?? []];
  }, (variant, store) => {
    return {
      ...variant,
      ...(store === undefined ? {} : { store }),
    };
  });

  const datas = across(stores, (variant) => {
    return offered(DATA_CHOICES, ANSWERS.data, recordOf(variant), {
      ...DEFAULT_ANSWERS,
      ...variant,
    });
  }, (variant, data) => {
    return {
      ...variant,
      ...(data === undefined ? {} : { data }),
    };
  });

  const mockings = across(datas, (variant) => {
    return offered(MOCKING_CHOICES, ANSWERS.mocking, recordOf(variant), {
      ...DEFAULT_ANSWERS,
      ...variant,
    });
  }, (variant, mocking) => {
    return {
      ...variant,
      ...(mocking === undefined ? {} : { mocking }),
    };
  });

  // Every target asks. The full set holds both zh tags, so only an exact-tag match resolves zh-TW.
  const languages = across(mockings, () => {
    return [undefined, LANGUAGES];
  }, (variant, chosen) => {
    return {
      ...variant,
      ...(chosen === undefined ? {} : { languages: [...chosen] }),
    };
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
  const extra = [...smokes, ...varied];

  return extra;
};

export const targetCases = (target: TargetId): E2eCase[] => {
  const every = everyCase(target);

  const paired = env['E2E_FULL'] === '1' ? every : coveringSubset(every);

  // Stable, so a tie keeps the first.
  const byWidth = (left: E2eCase, right: E2eCase): number => {
    return answerCount(right) - answerCount(left);
  };

  const widest = every
    .toSorted(byWidth)
    .slice(0, 1);
  const extra = widest
    .flatMap((item) => {
      return fullCases(target, item);
    });
  const cases = [...paired, ...extra];

  return cases;
};
