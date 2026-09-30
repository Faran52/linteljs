import { env } from 'node:process';

import {
  type Answers,
  type HostedFramework,
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

// Every pair rather than every combination: every defect found so far was a two-way interaction.
// `E2E_FULL=1` runs the cross product instead.

// Always every value, so one case carries the whole set.
const everyMultiSelect = (target: TargetId): Partial<Answers> => {
  return {
    libraries: [...LIBRARIES],
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
