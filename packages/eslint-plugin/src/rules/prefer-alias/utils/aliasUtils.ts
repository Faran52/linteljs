import { posix } from 'node:path';

import type { CompilerOptions } from 'typescript';

export interface Alias {
  prefix: string;
  directory: string;
  // The non-wildcard key onto the directory itself, as in `"@ui": ["./src/ui"]` beside `"@ui/*"`.
  exact?: string;
}

export interface AliasedProject {
  base: string;
  aliases: Alias[];
  // Exact keys onto a file: tsc takes them before any `prefix/*`, so the prefix arithmetic is wrong for them.
  pinned: string[];
}

const endsInOneStar = (pattern: string, tail: string): boolean => {
  return pattern.endsWith(tail) && pattern.indexOf('*') === pattern.length - 1;
};

// `prefix*` onto `directory/*`, each with the exact key onto the same directory when there is one.
const aliasesOf = (paths: Record<string, string[]>, base: string): Alias[] => {
  const entries = Object.entries(paths);

  return entries
    .flatMap(([pattern, [substitution = '']]) => {
      if (!endsInOneStar(pattern, '*') || !endsInOneStar(substitution, '/*')) {
        return [];
      }

      const directory = posix.resolve(base, substitution.slice(0, -2));
      const exact = entries
        .find(([key, [target]]) => {
          return target !== undefined && !key.includes('*') && posix.resolve(base, target) === directory;
        });

      return [{
        prefix: pattern.slice(0, -1),
        directory,
        ...(exact && { exact: exact[0] }),
      }];
    });
};

// `paths` resolve from the tsconfig that declares them. A `baseUrl` also makes every bare specifier
// resolvable from it, so no rewrite could be proven to land on the same file: the project is skipped.
export const aliasedProjectOf = (options: CompilerOptions): AliasedProject | undefined => {
  const { paths, pathsBasePath } = options;

  if (!paths || typeof pathsBasePath !== 'string' || 'baseUrl' in options) {
    return undefined;
  }

  const aliases = aliasesOf(paths, pathsBasePath);
  const pinned = Object.keys(paths)
    .filter((key) => {
      return !key.includes('*') && !aliases
        .some((alias) => {
          return alias.exact === key;
        });
    });

  return {
    base: pathsBasePath,
    aliases,
    pinned,
  };
};

const longest = (aliases: Alias[], length: (alias: Alias) => number): Alias | undefined => {
  let found: Alias | undefined;

  for (const alias of aliases) {
    if (length(alias) > (found === undefined ? -1 : length(found))) {
      found = alias;
    }
  }

  return found;
};

// The deepest directory holding the path, which is the most specific alias for it.
export const aliasHolding = (aliases: Alias[], path: string): Alias | undefined => {
  const holding = aliases
    .filter((alias) => {
      return path.startsWith(`${alias.directory}/`) || (alias.exact !== undefined && path === alias.directory);
    });

  return longest(holding, (alias) => {
    return alias.directory.length;
  });
};

// TypeScript's own pick: an exact key first, then of the patterns that match, the one with the longest prefix.
export const aliasMatching = (aliases: Alias[], specifier: string): Alias | undefined => {
  const exact = aliases
    .find((alias) => {
      return alias.exact === specifier;
    });

  if (exact) {
    return exact;
  }

  const matching = aliases
    .filter((alias) => {
      return specifier.startsWith(alias.prefix);
    });

  return longest(matching, (alias) => {
    return alias.prefix.length;
  });
};

export const throughAlias = (alias: Alias, path: string): string => {
  if (path === alias.directory && alias.exact !== undefined) {
    return alias.exact;
  }

  return `${alias.prefix}${path.slice(alias.directory.length + 1)}`;
};

export const pathOf = (alias: Alias, specifier: string): string => {
  // An exact key is its prefix less the slash, so the slice is empty and the join is the directory.
  const rest = specifier.slice(alias.prefix.length);

  return posix.join(alias.directory, rest);
};

export const relativeBetween = (file: string, path: string): string => {
  const relative = posix.relative(posix.dirname(file), path);

  if (relative === '') {
    return '.';
  }

  return relative === '..' || relative.startsWith('../') ? relative : `./${relative}`;
};

export const matchesGlob = (glob: string, path: string): boolean => {
  const source = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // `**/` may match no directory at all, as in every glob tool.
    .replace(/(\*\*\/)|(\*\*)|(\*)|\?/g, (_token, globstarSlash?: string, globstar?: string, star?: string) => {
      if (globstarSlash !== undefined) {
        return '(?:.*/)?';
      }

      if (globstar !== undefined) {
        return '.*';
      }

      return star === undefined ? '[^/]' : '[^/]*';
    });

  return new RegExp(`^${source}$`).test(path);
};
