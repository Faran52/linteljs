import { env } from 'node:process';

import { REPOSITORY_ENV } from '../constants';

export const repositoryFreeEnv = (): NodeJS.ProcessEnv => {
  const kept = Object.entries(env)
    .filter(([name]) => {
      return !REPOSITORY_ENV.has(name);
    });

  return Object.fromEntries(kept);
};
