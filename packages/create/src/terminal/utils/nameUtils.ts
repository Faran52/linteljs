import { PROJECT_NAME_PATTERN, RESERVED_PROJECT_NAMES } from '../constants';

export const isValidProjectName = (name: string): boolean => {
  return name.length <= 214
    && PROJECT_NAME_PATTERN.test(name)
    && !RESERVED_PROJECT_NAMES.has(name);
};
