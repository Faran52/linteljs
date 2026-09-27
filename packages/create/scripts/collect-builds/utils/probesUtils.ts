import { ANSWERS, DEFAULT_ANSWERS } from '../../../src/answers';
import { targetFor } from '../../../src/targets';
import { valuesOf } from '../../../src/utils/objectUtils';

import type {
  Answers,
  HostedFramework,
  TargetId,
} from '../../../src/config/types';
import type { E2eCase } from '../../../src/pipeline/e2e/matrix/matrix';

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
