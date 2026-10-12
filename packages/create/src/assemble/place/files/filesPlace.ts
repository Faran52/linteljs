import { posix } from 'node:path';

import { pascalCase } from 'es-toolkit';

import { type DrawnFile } from '../../read/drawer/drawerReader';
import {
  type Share,
  shareOf,
  stringOf,
  stringRecordOf,
  stringsOf,
} from '../../utils/shareUtils';

import { CORE_ALIASES } from './constants';

export interface TextFile extends DrawnFile {
  text: string;
}

// `text` only where a specifier changed, so an untouched file still copies byte for byte.
export interface PlacedFile extends DrawnFile {
  text?: string;
}

interface Placement {
  roots: Record<string, string>;
  dirs: Record<string, string>;
  kebab: boolean;
  tests: string;
}

interface Placed {
  to: string;
  // The path the root mapping alone gives, where a tsconfig alias resolves; a page has none.
  rooted?: string;
}

interface Move extends TextFile, Placed {}

interface Alias {
  key: string;
  directories: string[];
}

const RELATIVE_SPECIFIER = /(["'])(\.\.?\/[^\n"']*)\1/g;

const NAMINGS = new Set(['camel', 'kebab']);

const headOf = (path: string): [string, string] => {
  const slash = path.indexOf('/');

  if (slash === -1) {
    throw new Error(`${path} is not under a place root`);
  }

  const split: [string, string] = [path.slice(0, slash), path.slice(slash + 1)];

  return split;
};

// The name splits at its first dot, so `Button.styles.ts` keeps `.styles.ts` whole.
const stemOf = (name: string): [string, string] => {
  const dot = name.includes('.') ? name.indexOf('.') : name.length;

  const split: [string, string] = [name.slice(0, dot), name.slice(dot)];

  return split;
};

const placementOf = (share: Share): Placement => {
  const roots = stringRecordOf(share, 'place');
  const naming = stringOf(roots, 'naming');

  if (!NAMINGS.has(naming)) {
    throw new Error(`place naming ${naming} is not camel or kebab`);
  }

  const placement: Placement = {
    roots,
    dirs: stringRecordOf(share, 'pages'),
    kebab: naming === 'kebab',
    tests: stringOf(roots, 'tests'),
  };

  return placement;
};

const placedPathOf = (path: string, {
  roots,
  dirs,
  kebab,
  tests,
}: Placement): Placed => {
  const [root, rest] = headOf(path);
  const target = root === 'naming' || root === 'tests' ? undefined : roots[root];

  if (target === undefined) {
    throw new Error(`${path} starts with no place root`);
  }

  const [stem, extension] = stemOf(posix.basename(rest));
  const suffixed = extension.replace(/^\.test\./, `${tests}.`);
  const named = kebab
    ? stem
        .replaceAll(/([\da-z])([A-Z])/g, '$1-$2')
        .toLowerCase()
    : stem;

  if (root === 'pages') {
    const [page, file] = headOf(rest);
    const template = target
      .replaceAll('{dir}', () => {
        const dir = dirs[page];

        if (dir === undefined) {
          throw new Error(`${path} is a page the shell's pages map lacks`);
        }

        return dir;
      })
      .replaceAll('{page}', page)
      .replaceAll('{Page}', pascalCase(page));
    // A file below the page keeps its own name in the page's placed directory.
    const to = file.includes('/')
      ? posix.join(posix.dirname(template), posix.dirname(file), `${named}${suffixed}`)
      : `${template}${suffixed}`;
    const placed: Placed = { to };

    return placed;
  }

  const to = posix.join(target, posix.dirname(rest), `${named}${suffixed}`);
  const placed: Placed = {
    to,
    rooted: posix.join(target, rest),
  };

  return placed;
};

const withoutExtension = (path: string): string => {
  return path.slice(0, path.length - posix.extname(path).length);
};

// Each file's path, its path without its extension, and an index file's directory, to its placed form.
const specifierTargetsOf = (moves: readonly (readonly [string, string])[]): Map<string, string> => {
  const targets = new Map<string, string>();

  for (const [path, to] of moves) {
    targets.set(path, to);
    targets.set(withoutExtension(path), withoutExtension(to));

    if (posix.basename(path).startsWith('index.')) {
      targets.set(posix.dirname(path), posix.dirname(to));
    }
  }

  return targets;
};

// The unit's composed `tsconfig.compilerOptions.paths`, the one alias source.
const aliasesOf = (share: Share): Alias[] => {
  const tsconfig = shareOf(share, 'tsconfig');
  const compilerOptions = shareOf(tsconfig, 'compilerOptions');
  const paths = shareOf(compilerOptions, 'paths');

  return Object.keys(paths)
    .map((key) => {
      const alias: Alias = {
        key,
        directories: stringsOf(paths, key),
      };

      return alias;
    });
};

const aroundStar = (pattern: string): [string, string] => {
  const star = pattern.indexOf('*');
  const split: [string, string] = star === -1
    ? [pattern, '']
    : [pattern.slice(0, star), pattern.slice(star + 1)];

  return split;
};

// As tsc picks: an exact key first, else the wildcard key with the longest prefix.
const aliasOf = (specifier: string, aliases: readonly Alias[]): Alias | undefined => {
  const exact = aliases
    .find(({ key }) => {
      return key === specifier;
    });

  if (exact !== undefined) {
    return exact;
  }

  const wildcards = aliases
    .filter(({ key }) => {
      const [prefix, suffix] = aroundStar(key);

      return key.includes('*') && specifier.startsWith(prefix) && specifier.endsWith(suffix);
    })
    .toSorted((left, right) => {
      return right.key.indexOf('*') - left.key.indexOf('*');
    });

  return wildcards.at(0);
};

// Resolves the specifier through its alias's directories and spells the placed file it lands on.
const aliasRewriteOf = (
  path: string,
  specifier: string,
  aliases: readonly Alias[],
  targets: Map<string, string>,
): string => {
  const alias = aliasOf(specifier, aliases);

  if (alias === undefined) {
    return specifier;
  }

  const { key, directories } = alias;
  const name = key
    .split('/', 1)
    .join('');

  if (!CORE_ALIASES.includes(name)) {
    throw new Error(`${path} imports ${specifier} through ${name}, which is not a core alias`);
  }

  if (!key.includes('*')) {
    return specifier;
  }

  const [prefix, suffix] = aroundStar(key);
  const middle = specifier.slice(prefix.length, specifier.length - suffix.length);

  for (const directory of directories) {
    const [head, tail] = aroundStar(posix.normalize(directory));
    const target = targets.get(`${head}${middle}${tail}`);

    if (target !== undefined) {
      return `${prefix}${target.slice(head.length, target.length - tail.length)}${suffix}`;
    }
  }

  return specifier;
};

const aliasesRewritten = (
  text: string,
  path: string,
  aliases: readonly Alias[],
  targets: Map<string, string>,
): string => {
  const prefixes = aliases
    .map(({ key }) => {
      return RegExp.escape(aroundStar(key)[0]);
    });
  const specifiers = new RegExp(String.raw`(["'])((?:${prefixes.join('|')})[^\n"']*)\1`, 'g');

  return text
    .replaceAll(specifiers, (_match: string, quote: string, specifier: string) => {
      return `${quote}${aliasRewriteOf(path, specifier, aliases, targets)}${quote}`;
    });
};

const relativesRewritten = (text: string, path: string, to: string, targets: Map<string, string>): string => {
  return text
    .replaceAll(RELATIVE_SPECIFIER, (match: string, quote: string, specifier: string) => {
      const resolved = posix.join(posix.dirname(path), specifier);
      const target = targets.get(resolved);

      if (target === undefined) {
        return match;
      }

      const relative = posix.relative(posix.dirname(to), target);
      const dotted = relative.startsWith('.') ? relative : `./${relative}`;

      return `${quote}${dotted}${quote}`;
    });
};

const pairsOf = (moves: readonly Move[], from: (move: Move) => string | undefined): [string, string][] => {
  return moves
    .flatMap((move) => {
      const path = from(move);
      const pairs: [string, string][] = path === undefined ? [] : [[path, move.to]];

      return pairs;
    });
};

// Places each logical path through the share's `place` table and points relative specifiers, and alias ones
// resolved through the unit's tsconfig paths, at the placed files.
export const filesPlace = (files: readonly TextFile[], share: Share): PlacedFile[] => {
  const placement = placementOf(share);
  const aliases = aliasesOf(share);
  const moves = files
    .map((file) => {
      const move: Move = {
        ...file,
        ...placedPathOf(file.path, placement),
      };

      return move;
    });
  const targets = specifierTargetsOf(pairsOf(moves, ({ path }) => {
    return path;
  }));
  const aliasTargets = specifierTargetsOf(pairsOf(moves, ({ rooted }) => {
    return rooted;
  }));

  return moves
    .map(({
      path,
      source,
      text,
      to,
    }) => {
      const relative = relativesRewritten(text, path, to, targets);
      const rewritten = aliasesRewritten(relative, path, aliases, aliasTargets);
      const file: PlacedFile = {
        path: to,
        source,
        ...rewritten === text ? {} : { text: rewritten },
      };

      return file;
    });
};
