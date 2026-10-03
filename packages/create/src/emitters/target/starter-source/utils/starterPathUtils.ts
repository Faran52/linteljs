import { posix } from 'node:path';

import { CODE_EXTENSION, NOT_DOTTED } from '../constants';

// A code file's path as an import names it, with no extension.
export const stem = (path: string): string => {
  return path.replace(CODE_EXTENSION, '');
};

export const relativeSpecifier = (fromDirectory: string, to: string): string => {
  return posix
    .relative(fromDirectory, to)
    .replace(NOT_DOTTED, './');
};
