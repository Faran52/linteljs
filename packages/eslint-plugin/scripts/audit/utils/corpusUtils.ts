import { hash } from 'node:crypto';
import {
  type Dirent,
  existsSync,
  readdirSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import {
  extname,
  join,
  resolve,
} from 'node:path';

import { maxBy } from 'es-toolkit';

export type SkipReason = 'compiled' | 'minified' | 'oversized';

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  '.git',
  '.stryker-tmp',
]);
const SCRIPT_EXTENSIONS = new Set([
  '.cjs',
  '.js',
  '.jsx',
  '.mjs',
  '.ts',
  '.tsx',
]);

// Above these sit bundled `.d.ts` blobs and minified output that cost seconds to parse and say nothing new.
const MAX_BYTES = 524_288;
const MAX_LINE = 1000;
const MAX_AVERAGE_LINE = 200;

const MAX_MESSAGE_CHARS = 160;

// The workspace store: pnpm fills this package's `node_modules` with symlinks the walk skips.
const HOME = homedir();
const TEMP = tmpdir();
const DEFAULT_SOURCES = [
  resolve(import.meta.dirname, '../../../../../node_modules'),
  join(HOME, 'Projects'),
  join(TEMP, 'linteljs-real-code'),
];

export const sourcesFrom = (given: string[]): string[] => {
  return (given.length > 0 ? given : DEFAULT_SOURCES)
    .map((dir) => {
      return resolve(dir);
    })
    .filter((dir) => {
      return existsSync(dir);
    });
};

// An unreadable directory reads as empty.
const entriesOf = (dir: string): Dirent[] => {
  try {
    return readdirSync(dir, { withFileTypes: true });
  }
  catch {
    return [];
  }
};

const descends = (entry: Dirent, keepNodeModules: boolean): boolean => {
  return entry.isDirectory()
    && (!SKIP_DIRS.has(entry.name) || (keepNodeModules && entry.name === 'node_modules'));
};

const isScript = (entry: Dirent): boolean => {
  const extension = extname(entry.name);

  return entry.isFile() && !entry.name.includes('.min.') && SCRIPT_EXTENSIONS.has(extension);
};

// Symlinks are neither file nor directory, which keeps cycles out.
// Lazy: eager, one capped run spent seven of its ten seconds on the walk.
const walk = function* (dir: string, keepNodeModules: boolean): Generator<string> {
  const entries = entriesOf(dir);

  for (const entry of entries) {
    if (descends(entry, keepNodeModules)) {
      const subdir = join(dir, entry.name);

      yield* walk(subdir, keepNodeModules);
    }
    else if (isScript(entry)) {
      yield join(dir, entry.name);
    }
  }
};

export const filesUnder = (dir: string): Generator<string> => {
  const insideNodeModules = dir.includes('node_modules');

  return walk(dir, insideNodeModules);
};

// In turn, so the first source does not spend the whole budget.
export const interleave = function* (dirs: string[]): Generator<string> {
  let live = dirs.map(filesUnder);

  while (live.length > 0) {
    const round = live
      .map((files) => {
        return files.next();
      });

    yield* round
      .flatMap((step) => {
        if (step.done === true) {
          return [];
        }

        const yielded = [step.value];

        return yielded;
      });

    live = live
      .filter((_, index) => {
        return round[index]?.done !== true;
      });
  }
};

export const countMatches = (text: string, pattern: RegExp): number => {
  return text.match(pattern)?.length ?? 0;
};

export const skipReason = (source: string): SkipReason | undefined => {
  if (source.length > MAX_BYTES) {
    return 'oversized';
  }

  if (source.includes('sourceMappingURL')) {
    return 'compiled';
  }

  const lines = source.split('\n');
  const longest = maxBy(lines, (line) => {
    return line.length;
  })?.length ?? 0;

  return source.length / lines.length > MAX_AVERAGE_LINE || longest > MAX_LINE ? 'minified' : undefined;
};

// Vendored copies of one file count once.
export const isFirstSighting = (seen: Set<string>, source: string): boolean => {
  const digest = hash('sha256', source);

  if (seen.has(digest)) {
    return false;
  }

  seen.add(digest);

  return true;
};

export const messageOf = (error: unknown): string => {
  return (error instanceof Error ? error.message : String(error))
    .split('\n', 1)
    .join('')
    .slice(0, MAX_MESSAGE_CHARS);
};
