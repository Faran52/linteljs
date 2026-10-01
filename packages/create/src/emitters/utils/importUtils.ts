import { partition } from 'es-toolkit';

import { FRAMEWORK_GROUPS } from '@config/constants';

import type { Framework } from '@config/types';

// The bare module name, unquoted.
const specifierOf = (line: string): string => {
  return line.slice(line.indexOf("'") + 1, line.lastIndexOf("'"));
};

// `simple-import-sort`'s own key: it swaps these four so `vite` sorts before `vite-plugin-solid`.
const sortKeyOf = (line: string): string => {
  return specifierOf(line)
    .replaceAll(/[./_-]/g, (character) => {
      return '_-./'.charAt('./_-'.indexOf(character));
    });
};

// A generated project lints itself, so an emitted import block out of `simple-import-sort` order fails.
// The framework's own packages lead, in a group of their own, as the emitted import sort has them.
export const sortedImports = (lines: string[], framework?: Framework): string => {
  const bySpecifier = (left: string, right: string): number => {
    return sortKeyOf(left).localeCompare(sortKeyOf(right), 'en', {
      sensitivity: 'base',
      numeric: true,
    });
  };
  const [own, external] = partition(lines, (line) => {
    return specifierOf(line).startsWith('.');
  });
  const [leading, packages] = partition(external, (line) => {
    return framework !== undefined && FRAMEWORK_GROUPS[framework]
      .some((pattern) => {
        return new RegExp(pattern).test(specifierOf(line));
      });
  });

  return [
    leading,
    packages,
    own,
  ]
    .filter((group) => {
      return group.length > 0;
    })
    .map((group) => {
      return group
        .toSorted(bySpecifier)
        .join('\n');
    })
    .join('\n\n');
};
