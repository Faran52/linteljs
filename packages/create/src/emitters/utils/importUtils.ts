import { partition } from 'es-toolkit';

// Everything after `from`, quotes included, so sorting by it is sorting by specifier.
const specifierOf = (line: string): string => {
  return line.replace(/^import .* from /, '');
};

/**
 * The order `simple-import-sort` would fix to: packages by specifier, then the project's own files after a blank
 * line. Here rather than beside one emitter because two config files are assembled the same way, and a generated
 * project lints itself, so an emitted import block in any other order fails its own first `pnpm lint`.
 */
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
