import {
  ANSWERS,
  type Answers,
  DEFAULT_ANSWERS,
  type HostedFramework,
  type TargetId,
} from '../../src/answers';
import { targetFor } from '../../src/targets';
import { valuesOf } from '../../src/utils/objectUtils';

import type { E2eCase } from '../../src/pipeline/e2e/matrix/matrix';

// Everything installable on, so one run per target is enough. The axes left at default only replace a package.
const maximal = (target: TargetId, hostedFramework: HostedFramework | undefined): Answers => {
  const hosted = hostedFramework === undefined ? {} : { hostedFramework };
  const record = targetFor({
    ...DEFAULT_ANSWERS,
    target,
    ...hosted,
  });

  return {
    ...DEFAULT_ANSWERS,
    target,
    libraries: valuesOf(ANSWERS.libraries.values),
    agents: valuesOf(ANSWERS.agents.values),
    plugins: valuesOf(ANSWERS.plugins.values),
    testing: 'vitest',
    ...(record.stores?.[0] === undefined ? {} : { store: record.stores[0] }),
    form: 'tanstack-form',
    ...hosted,
    ...(record.routers === undefined ? {} : { router: record.routers[0] }),
    ...(target === 'webextension' ? { surfaces: valuesOf(ANSWERS.surfaces.values) } : {}),
  };
};

// The plain targets, plus each hosting target once per framework it can host and once without.
export const probes = (): E2eCase[] => {
  return valuesOf(ANSWERS.target.values).flatMap((target) => {
    const hosts = targetFor({
      ...DEFAULT_ANSWERS,
      target,
    }).hostsFramework === true
      ? [undefined, ...valuesOf(ANSWERS.hostedFramework.values)]
      : [undefined];

    return hosts.map((hostedFramework) => {
      return {
        label: hostedFramework === undefined ? target : `${target} hosting ${hostedFramework}`,
        answers: maximal(target, hostedFramework),
      };
    });
  });
};

export const flagsFor = (answers: Answers): string[] => {
  return [
    '--target', answers.target,
    '--testing', answers.testing,
    '--type-safety', answers.typeSafety,
    '--libraries', answers.libraries.join(','),
    '--agents', answers.agents.join(','),
    '--plugins', answers.plugins.join(','),
    ...(answers.target === 'webextension' ? ['--browser', answers.browser] : []),
    ...(answers.hostedFramework === undefined ? [] : ['--hosted', answers.hostedFramework]),
    ...(answers.surfaces === undefined ? [] : ['--surfaces', answers.surfaces.join(',')]),
    ...(answers.form === undefined ? [] : ['--form', answers.form]),
    ...(answers.router === undefined ? [] : ['--router', answers.router]),
    ...(answers.store === undefined ? [] : ['--store', answers.store]),
  ];
};
