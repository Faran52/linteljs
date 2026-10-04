import { unscopedName } from '@utils/nameUtils';

import {
  MAX_PROJECT_NAME_LENGTH,
  PROJECT_NAME_PATTERN,
  RESERVED_PROJECT_NAMES,
} from '../constants';

export const isValidProjectName = (name: string): boolean => {
  const directory = unscopedName(name);

  return name.length <= MAX_PROJECT_NAME_LENGTH
    && PROJECT_NAME_PATTERN.test(name)
    && !RESERVED_PROJECT_NAMES.has(directory);
};
