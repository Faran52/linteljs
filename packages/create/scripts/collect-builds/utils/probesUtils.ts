import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '../../../src/answers';
import { targetFor } from '../../../src/targets';

import type {
  Answers,
  HostedFramework,
  TargetId,
} from '@config/types';
import type { E2eCase } from '@pipeline/e2e/matrix/matrix';

// Everything on, so one run per target covers it.
const maximal = (target: TargetId, hostedFramework: HostedFramework | undefined): Answers => {
  const hosted = hostedFramework === undefined ? {} : { hostedFramework };
  const record = targetFor({
    ...DEFAULT_ANSWERS,
    target,
    ...hosted,
  });

  const answers: Answers = {
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

  return answers;
};

export const probes = (): E2eCase[] => {
  return valuesOf(ANSWERS.target.values)
    .flatMap((target) => {
      const hosts = targetFor({
        ...DEFAULT_ANSWERS,
        target,
      }).hostsFramework === true
        ? [undefined, ...valuesOf(ANSWERS.hostedFramework.values)]
        : [undefined];

      return hosts
        .map((hostedFramework) => {
          const probe = {
            label: hostedFramework === undefined ? target : `${target} hosting ${hostedFramework}`,
            answers: maximal(target, hostedFramework),
          };

          return probe;
        });
    });
};
