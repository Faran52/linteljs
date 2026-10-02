import { partition } from 'es-toolkit';

import { FRAMEWORK_GROUPS } from '@config/constants';

import type { Framework } from '@config/types';

// The bare module name, unquoted.
const specifierOf = (line: string): string => {
  const start = line.indexOf("'") + 1;
  const end = line.lastIndexOf("'");

  return line.slice(start, end);
};

// `simple-import-sort`'s own key: it swaps these four so `vite` sorts before `vite-plugin-solid`.
const sortKeyOf = (line: string): string => {
  return specifierOf(line)
    .replaceAll(/[./_-]/g, (character) => {
      const slot = './_-'.indexOf(character);

      return '_-./'.charAt(slot);
    });
};

// A generated project lints itself, so an emitted import block out of `simple-import-sort` order fails.
// The framework's own packages lead, in a group of their own, as the emitted import sort has them.
export const sortedImports = (lines: string[], framework?: Framework): string => {
  const bySpecifier = (left: string, right: string): number => {
    const leftKey = sortKeyOf(left);
    const rightKey = sortKeyOf(right);

    return leftKey.localeCompare(rightKey, 'en', {
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
        const specifier = specifierOf(line);

        return new RegExp(pattern).test(specifier);
      });
  });

  const groups = [
    leading,
    packages,
    own,
  ];

  return groups
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
