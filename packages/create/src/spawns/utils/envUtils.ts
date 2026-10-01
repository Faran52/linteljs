import { env } from 'node:process';

import { REPOSITORY_ENV } from '../constants';

export const repositoryFreeEnv = (): NodeJS.ProcessEnv => {
  return Object.fromEntries(Object.entries(env)
    .filter(([name]) => {
      return !REPOSITORY_ENV.has(name);
    }));
};
