import { partition } from 'es-toolkit';

const specifierOf = (line: string): string => {
  return line.replace(/^import .* from /, '');
};

// A generated project lints itself, so an emitted import block out of `simple-import-sort` order fails.
export const sortedImports = (lines: string[]): string => {
  const bySpecifier = (left: string, right: string): number => {
    return specifierOf(left).localeCompare(specifierOf(right), 'en');
  };
  const [own, packages] = partition(lines, (line) => {
    return specifierOf(line).startsWith("'.");
  });

  own.sort(bySpecifier);
  packages.sort(bySpecifier);

  return [packages.join('\n'), ...(own.length === 0 ? [] : [own.join('\n')])].join('\n\n');
};
