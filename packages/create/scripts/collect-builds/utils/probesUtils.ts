import { keysOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '../../../src/answers';
import { targetFor } from '../../../src/targets';

import type {
  Answers,
  HostedFramework,
  TargetId,
} from '@config/types';
import type { E2eCase } from '@e2e/matrix/matrix';

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
    libraries: keysOf(ANSWERS.libraries.values),
    agents: keysOf(ANSWERS.agents.values),
    plugins: keysOf(ANSWERS.plugins.values),
    testing: 'vitest',
    ...(record.stores?.[0] === undefined ? {} : { store: record.stores[0] }),
    form: 'tanstack-form',
    ...hosted,
    ...(record.routers === undefined ? {} : { router: record.routers[0] }),
    ...(target === 'webextension' ? { surfaces: keysOf(ANSWERS.surfaces.values) } : {}),
  };

  return answers;
};

export const probes = (): E2eCase[] => {
  return keysOf(ANSWERS.target.values)
    .flatMap((target) => {
      const hosts = targetFor({
        ...DEFAULT_ANSWERS,
        target,
      }).hostsFramework === true
        ? [undefined, ...keysOf(ANSWERS.hostedFramework.values)]
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
