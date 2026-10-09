import { projectNameOf, unscopedName } from '@utils/nameUtils';

import { PROJECT_NAME_PATTERN } from '@answers';

import {
  MAX_PROJECT_NAME_LENGTH,
  NPM_NAME_PATTERN,
  RESERVED_PROJECT_NAMES,
} from '../constants';

export const isValidProjectName = (name: string): boolean => {
  const directory = unscopedName(name);

  return name.length <= MAX_PROJECT_NAME_LENGTH
    && NPM_NAME_PATTERN.test(name)
    && !RESERVED_PROJECT_NAMES.has(directory);
};

// A monorepo project's name is its directory: kebab-case, unique, and never the root package's name.
export const isValidProjectDirName = (name: string, workspaceName: string, taken: readonly string[]): boolean => {
  return name.length <= MAX_PROJECT_NAME_LENGTH
    && new RegExp(PROJECT_NAME_PATTERN, 'v').test(name)
    && name !== `${projectNameOf(workspaceName)}-workspace`
    && !taken.includes(name);
};
