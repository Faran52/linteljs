import { env } from 'node:process';

import {
  AGENTS,
  type Answers,
  BROWSERS,
  DEFAULT_ANSWERS,
  type Form,
  FORMS,
  type Framework,
  HOSTED_FRAMEWORKS,
  type HostedFramework,
  LIBRARIES,
  PACKAGE_MANAGERS,
  PLUGINS,
  rendersWithReact,
  type Router,
  SURFACES,
  TARGET_IDS,
  type TargetId,
  TESTING_CHOICES,
  TYPE_SAFETY_CHOICES,
} from '../../../model/answers/answers';
import { targetFor } from '../../../model/targets';

import type { TargetRecord } from '../../../model/targets/record';

export interface E2eCase {
  label: string;
  answers: Answers;
}

/**
 * Two families, and between them every answer this CLI can be given.
 *
 * `managers` is every target on every package manager with every multi-select at its full value: the heaviest
 * dependency set a target has, installed four ways. That is what catches a library breaking a project and a manager
 * resolving the same manifest differently, and it is the only family that runs anything but pnpm.
 *
 * `options` is every combination of the single-select axes on pnpm alone. Multiplying those by four managers is what
 * made the matrix 1200; a manager does not change which config is emitted, so it is fixed here and the combinations
 * are what vary. The two families overlap on one case per target, which `ALL_CASES` drops.
 */

// A multi-select is never combined: it is always every value it has, so one case carries the whole set.
const everyMultiSelect = (target: TargetId): Partial<Answers> => {
  return {
    libraries: LIBRARIES,
    agents: AGENTS,
    plugins: PLUGINS,
    // Refused on a target that has no surfaces to name.
    ...(target === 'webextension' ? { surfaces: SURFACES } : {}),
  };
};

const recordFor = (target: TargetId, hostedFramework: HostedFramework | undefined): TargetRecord => {
  return targetFor({
    ...DEFAULT_ANSWERS,
    target,
    ...(hostedFramework === undefined ? {} : { hostedFramework }),
  });
};

// `react-hook-form` binds React, so a non-React target is offered the other one alone. `undefined` is no form library.
const formsFor = (framework: Framework | undefined): (Form | undefined)[] => {
  return [undefined, ...FORMS.filter((form) => {
    return rendersWithReact(framework) || form !== 'react-hook-form';
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
  return variants.flatMap((variant) => {
    return valuesFor(variant).map((value) => {
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
    ...(answers.store ? ['store'] : []),
  ].join(' ');
};

const asCase = (answers: Answers): E2eCase => {
  return {
    label: labelFor(answers),
    answers,
  };
};

// Every target on every manager, at maximum dependency pressure and default options.
const managerCases = (target: TargetId): E2eCase[] => {
  return PACKAGE_MANAGERS.map((packageManager) => {
    return asCase({
      ...DEFAULT_ANSWERS,
      ...everyMultiSelect(target),
      target,
      packageManager,
    });
  });
};

// Every combination of the single-select axes a target actually asks for, on pnpm.
const optionCases = (target: TargetId): E2eCase[] => {
  const recordOf = (variant: Partial<Answers>): TargetRecord => {
    return recordFor(target, variant.hostedFramework);
  };

  const hosted = across([{}], () => {
    return hostedFor(recordFor(target, undefined));
  }, (variant, hostedFramework) => {
    return {
      ...variant,
      ...(hostedFramework === undefined ? {} : { hostedFramework }),
    };
  });

  const browsers = across(hosted, (variant) => {
    return recordOf(variant).hostsBrowser === true ? BROWSERS : [DEFAULT_ANSWERS.browser];
  }, (variant, browser) => {
    return {
      ...variant,
      browser,
    };
  });

  const forms = across(browsers, (variant) => {
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
    return recordOf(variant).store === undefined ? [false] : [false, true];
  }, (variant, store) => {
    return {
      ...variant,
      store,
    };
  });

  const testings = across(stores, () => {
    return TESTING_CHOICES;
  }, (variant, testing) => {
    return {
      ...variant,
      testing,
    };
  });

  return across(testings, () => {
    return TYPE_SAFETY_CHOICES;
  }, (variant, typeSafety) => {
    return {
      ...variant,
      typeSafety,
    };
  }).map((variant) => {
    return asCase({
      ...DEFAULT_ANSWERS,
      ...everyMultiSelect(target),
      ...variant,
      target,
      packageManager: 'pnpm',
    });
  });
};

// Grouped by target and ordered, because the shard below is a stride over this list and the label is its identity.
const ALL_CASES: E2eCase[] = TARGET_IDS.flatMap((target) => {
  const seen = new Set<string>();

  return [...managerCases(target), ...optionCases(target)].filter((item) => {
    const fresh = !seen.has(item.label);

    seen.add(item.label);

    return fresh;
  });
});

/**
 * A stride rather than a slice, and over every target's cases rather than over the files: each shard then holds an
 * even share of every target, so a shard is never the one that drew React Native and Angular. Vitest's own `--shard`
 * splits by file, which cannot balance nine files holding 12 to 92 cases each.
 *
 * Every shard is its own machine in `e2e.yml`, so every shard starts its own registry on the same port. Two on one
 * machine would collide, which `requireFreePort` refuses by design: local parallelism is `maxConcurrency` inside one
 * process against one registry, not several processes against several.
 */
const SHARD = Number(env['E2E_SHARD'] ?? '1');
const SHARDS = Number(env['E2E_SHARDS'] ?? '1');

// The ceiling is the smallest target's case count, 11, below which a shard could draw no case from a file at all.
if (SHARDS > 11 || SHARD < 1 || SHARD > SHARDS) {
  throw new Error(`E2E_SHARD ${String(SHARD)} of ${String(SHARDS)} is out of range: 1 to 11 shards`);
}

export const casesFor = (target: TargetId): E2eCase[] => {
  return ALL_CASES.filter((item, index) => {
    return item.answers.target === target && index % SHARDS === SHARD - 1;
  });
};
