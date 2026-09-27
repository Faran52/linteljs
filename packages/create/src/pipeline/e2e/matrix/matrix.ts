import { env } from 'node:process';

import {
  type Answers,
  type Form,
  type Framework,
  type HostedFramework,
  type Router,
  type TargetId,
} from '@config/types';

import { rendersWithReact } from '@utils/answerUtils';

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
  LIBRARIES,
  PACKAGE_MANAGERS,
  PLUGINS,
  STYLING_CHOICES,
  SURFACES,
  TESTING_CHOICES,
  TYPE_SAFETY_CHOICES,
} from './constants';
import { coveringSubset } from './utils/pairwiseUtils';

export interface E2eCase {
  label: string;
  answers: Answers;
}

/**
 * Every combination of two answers, per target, in as few cases as the greedy will manage.
 *
 * Every defect this suite has found was a two-way interaction, and none needed a third axis pinned: `vue-demi` is
 * hosted-vue with TanStack Query, the devtools floating promise is the extension on chrome, the leftover suites are
 * `testing: none` on angular and on react-native, `customTypes.d.ts` is `typeSafety: relaxed` on angular, and the
 * rolldown peer is React on yarn 1. So the suite covers every *pair* of answers rather than every combination.
 *
 * The package manager is one of the axes: what a manager changes is how it resolves the dependency set a target and
 * its libraries emit, and the files the CLI writes for it, which is a pair of the manager with each of those
 * answers. Every multi-select stays at its full value in every case.
 *
 * Greedy set cover over the legal enumeration rather than synthesised candidates: every case it can pick is one the
 * CLI would accept, so no combination has to be checked for legality, and the pair universe is by construction the
 * reachable one. Deterministic, ties going to the earlier case, so a label that failed names the same case next run.
 *
 * `E2E_FULL=1` runs the cross product instead, for a pre-release sweep that wants three-way interactions too.
 */

// A multi-select is never combined: it is always every value it has, so one case carries the whole set.
const everyMultiSelect = (target: TargetId): Partial<Answers> => {
  return {
    libraries: [...LIBRARIES],
    agents: [...AGENTS],
    plugins: [...PLUGINS],
    // Refused on a target that has no surfaces to name.
    ...(target === 'webextension' ? { surfaces: [...SURFACES] } : {}),
  };
};

// The record for the answers chosen so far, which is what the prompt hands `targetFor` when it asks the next one.
const recordFor = (target: TargetId, variant: Partial<Answers>): TargetRecord => {
  return targetFor({
    ...DEFAULT_ANSWERS,
    ...variant,
    target,
  });
};

// `react-hook-form` binds React, so a non-React target is offered the other one alone. `undefined` is no form library.
const formsFor = (framework: Framework | undefined): (Form | undefined)[] => {
  return [undefined, ...FORMS
    .filter((form) => {
      return rendersWithReact(framework) || form !== 'react-hook-form';
    })];
};

// The values an optional choice offers here, read through the same predicate the prompt and the parser use, so the
// matrix cannot enumerate a combination `refuseMisfit` would then refuse. `undefined` is the answer's own none.
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

/**
 * One axis folded into what is built so far. The values an axis offers depend on the axes already chosen, because a
 * hosted framework decides both the form libraries and the naming, so the axis reads the variant rather than a
 * constant list.
 */
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

// Every axis that can vary, in a fixed order, so two cases can never share a label or the directory named after it.
const labelFor = (answers: Answers): string => {
  const record = targetFor(answers);

  return [
    answers.target,
    answers.packageManager,
    answers.testing,
    answers.typeSafety,
    ...(record.hostsBrowser === true ? [answers.browser] : []),
    ...(record.hostsFramework === true ? [`host-${answers.hostedFramework ?? 'none'}`] : []),
    ...(answers.form === undefined ? [] : [answers.form]),
    ...(answers.router === undefined ? [] : [answers.router]),
    ...(answers.store === undefined ? [] : [answers.store]),
    ...(answers.styling === undefined ? [] : [answers.styling]),
    ...(answers.data === undefined ? [] : [answers.data]),
  ].join(' ');
};

const asCase = (answers: Answers): E2eCase => {
  return {
    label: labelFor(answers),
    answers,
  };
};

// Every legal combination of the single-select axes a target asks for, on every manager. Reduced by `coveringSubset`.
const everyCase = (target: TargetId): E2eCase[] => {
  const recordOf = (variant: Partial<Answers>): TargetRecord => {
    return recordFor(target, variant);
  };

  const hosted = across([{}], () => {
    return hostedFor(recordFor(target, {}));
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
    return formsFor(recordOf(variant).framework);
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
    // Every store the target offers, plus none: the axis the pairwise cover walks.
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

  const testings = across(datas, () => {
    return [...TESTING_CHOICES];
  }, (variant, testing) => {
    return {
      ...variant,
      testing,
    };
  });

  const safeties = across(testings, () => {
    return [...TYPE_SAFETY_CHOICES];
  }, (variant, typeSafety) => {
    return {
      ...variant,
      typeSafety,
    };
  });

  return across(safeties, () => {
    return [...PACKAGE_MANAGERS];
  }, (variant, packageManager) => {
    return {
      ...variant,
      packageManager,
    };
  })
    .map((variant) => {
      return asCase({
        ...DEFAULT_ANSWERS,
        ...everyMultiSelect(target),
        ...variant,
        target,
      });
    });
};

export const targetCases = (target: TargetId): E2eCase[] => {
  const every = everyCase(target);

  return env['E2E_FULL'] === '1' ? every : coveringSubset(every);
};
