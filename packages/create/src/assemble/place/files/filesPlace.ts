import { posix } from 'node:path';

import { pascalCase } from 'es-toolkit';

import { type DrawnFile } from '../../read/drawer/drawerReader';
import {
  type Share,
  stringOf,
  stringRecordOf,
} from '../../utils/shareUtils';

export interface TextFile extends DrawnFile {
  text: string;
}

// `text` only where a relative specifier changed, so an untouched file still copies byte for byte.
export interface PlacedFile extends DrawnFile {
  text?: string;
}

interface Placement {
  roots: Record<string, string>;
  kebab: boolean;
  tests: string;
}

interface Move extends TextFile {
  to: string;
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
    kebab: naming === 'kebab',
    tests: stringOf(roots, 'tests'),
  };

  return placement;
};

const placedPathOf = (path: string, {
  roots,
  kebab,
  tests,
}: Placement): string => {
  const [root, rest] = headOf(path);
  const target = root === 'naming' || root === 'tests' ? undefined : roots[root];

  if (target === undefined) {
    throw new Error(`${path} starts with no place root`);
  }

  const [stem, extension] = stemOf(posix.basename(rest));
  const suffixed = extension.replace(/^\.test\./, `${tests}.`);

  if (root === 'pages') {
    const [page, file] = headOf(rest);

    if (file.includes('/')) {
      throw new Error(`${path} is nested below its page`);
    }

    const named = target
      .replaceAll('{page}', page)
      .replaceAll('{Page}', pascalCase(page));

    return `${named}${suffixed}`;
  }

  const named = kebab
    ? stem
        .replaceAll(/([\da-z])([A-Z])/g, '$1-$2')
        .toLowerCase()
    : stem;

  const placed = posix.join(target, posix.dirname(rest), `${named}${suffixed}`);

  return placed;
};

const withoutExtension = (path: string): string => {
  return path.slice(0, path.length - posix.extname(path).length);
};

// Each file's path, its path without its extension, and an index file's directory, to its placed form.
const specifierTargetsOf = (moves: readonly Move[]): Map<string, string> => {
  const targets = new Map<string, string>();

  for (const { path, to } of moves) {
    targets.set(path, to);
    targets.set(withoutExtension(path), withoutExtension(to));

    if (posix.basename(path).startsWith('index.')) {
      targets.set(posix.dirname(path), posix.dirname(to));
    }
  }

  return targets;
};

// Places each logical path through the share's `place` table and points relative specifiers at the placed files.
export const filesPlace = (files: readonly TextFile[], share: Share): PlacedFile[] => {
  const placement = placementOf(share);
  const moves = files
    .map((file) => {
      const move: Move = {
        ...file,
        to: placedPathOf(file.path, placement),
      };

      return move;
    });
  const targets = specifierTargetsOf(moves);

  return moves
    .map(({
      path,
      source,
      text,
      to,
    }) => {
      const rewritten = text
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
      const file: PlacedFile = {
        path: to,
        source,
        ...rewritten === text ? {} : { text: rewritten },
      };

      return file;
    });
};
