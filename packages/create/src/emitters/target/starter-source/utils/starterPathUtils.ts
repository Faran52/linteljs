import { posix } from 'node:path';

import { CODE_EXTENSION, NOT_DOTTED } from '../constants';

import type { AliasMap } from '@config/types';

const WILDCARD = '/*';

// A code file's path as an import names it, with no extension.
export const stem = (path: string): string => {
  return path.replace(CODE_EXTENSION, '');
};

const isInside = (directory: string, path: string): boolean => {
  return path.startsWith(`${directory}/`);
};

// As `@linteljs/prefer-alias` reads it: an import into an aliased directory its file is not inside takes the
// deepest alias over the target.
export const importSpecifier = (fromDirectory: string, to: string, aliases: AliasMap): string => {
  const [deepest] = Object.entries(aliases)
    .filter(([alias, directory]) => {
      return alias.endsWith(WILDCARD) && directory.endsWith(WILDCARD);
    })
    .map(([alias, directory]) => {
      const root = posix.normalize(directory.slice(0, -WILDCARD.length));
      const pair: [string, string] = [alias.slice(0, -WILDCARD.length), root];

      return pair;
    })
    .filter(([, root]) => {
      return isInside(root, to);
    })
    .toSorted(([, left], [, right]) => {
      return right.length - left.length;
    });

  if (deepest !== undefined && !isInside(deepest[1], `${fromDirectory}/`)) {
    const [alias, root] = deepest;

    return `${alias}${to.slice(root.length)}`;
  }

  return posix
    .relative(fromDirectory, to)
    .replace(NOT_DOTTED, './');
};
