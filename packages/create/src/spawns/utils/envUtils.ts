import { env } from 'node:process';

import { omit } from 'es-toolkit';

import { REPOSITORY_ENV } from '../constants';

export const repositoryFreeEnv = (): NodeJS.ProcessEnv => {
  return omit(env, REPOSITORY_ENV);
};
