import {
  globSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';

import { logError } from './loggerUtils.ts';

export interface BannedPattern {
  name: string;
  re: RegExp;
  // Matched with string literals blanked and comments kept: a directive lives inside a comment.
  inComments?: boolean;
  allowed?: RegExp[];
}

export type TypeSafety = 'strict' | 'relaxed';

export interface BannedScan {
  patterns: BannedPattern[];
  skipped: string[];
  extensions: string[];
}

const NARROWING_GUARD = /:\s*unknown\b[^)]*\)\s*:\s*\w+\s+is\s/;
const PARSED_JSON = /:\s*unknown\s*=\s*JSON\.parse\(/;
const DYNAMIC_IMPORT = /:\s*unknown\s*=\s*await import\(/;

// A guard's own type, as a parameter or an alias: only a real predicate on that one parameter satisfies it.
const GUARD_TYPE = /\(\s*(\w+)\s*:\s*unknown\s*\)\s*=>\s*\1\s+is\s/;

// A caught value has no distinct type, so the grant keys on the three conventional names and a single parameter.
const CAUGHT_VALUE = /\(\s*(?:error|cause|reason)\s*:\s*unknown\s*\)/;

// `.catch(cb)` binds a caught value whatever it is named, so this grant is structural.
const CAUGHT_IN_CHAIN = /\.catch\(\s*(?:async\s*)?\(\s*\w+\s*:\s*unknown\s*\)/;

// Anchored to comments, so prose can name a directive and a string literal stays fixture text.
export const directive = (name: string): RegExp => {
  return new RegExp(`(?://|/\\*)\\s*${name}`);
};

const ALWAYS_BANNED: BannedPattern[] = [
  {
    name: 'as unknown as',
    re: /\bas unknown as\b/,
  },
  {
    name: 'eslint-disable',
    re: directive('eslint-disable'),
    inComments: true,
  },
];

const STRICT_ONLY: BannedPattern[] = [
  {
    name: 'as never',
    re: /\bas never\b/,
  },
  {
    name: 'as unknown',
    re: /\bas unknown\b/,
  },
  {
    name: ': unknown',
    re: /:\s*unknown\b/,
    allowed: [
      NARROWING_GUARD,
      GUARD_TYPE,
      PARSED_JSON,
      DYNAMIC_IMPORT,
      CAUGHT_VALUE,
      CAUGHT_IN_CHAIN,
    ],
  },
  {
    name: '=> unknown',
    re: /=>\s*unknown\b/,
  },
  {
    name: 'unknown[]',
    re: /unknown\[]/,
  },
  {
    name: '<unknown>',
    re: /<unknown[,>]/,
  },
  {
    name: '@ts-ignore',
    re: directive('@ts-ignore'),
    inComments: true,
  },
  {
    name: '@ts-expect-error',
    re: directive('@ts-expect-error'),
    inComments: true,
  },
  {
    name: 'Record<string, unknown>',
    re: /Record<string,\s*unknown>/,
  },
  {
    name: 'index signature',
    // The trailing colon keeps a labelled tuple element, as in Vue's typed emits, from matching.
    re: /\[[A-Za-z_]\w*:\s*(?:string|number|symbol)]\s*:/,
  },
];

export const FLOORS: Record<TypeSafety, BannedPattern[]> = {
  strict: [...ALWAYS_BANNED, ...STRICT_ONLY],
  relaxed: ALWAYS_BANNED,
};

export const BASE_SKIPPED = ['/scripts/'];

// The leading slash lets `/scripts/` match a relative `scripts/tool.ts` as well as an absolute path.
const isSkipped = (filePath: string, skipped: string[]): boolean => {
  return skipped
    .some((fragment) => {
      return `/${filePath}`.includes(fragment);
    });
};

// Import and alias `as` are not assertions. One space after `as`, as in every banned `as` pattern.
const isAliasOrImportLine = (line: string): boolean => {
  return line.includes('* as ')
    || /^\s*import\b/.test(line)
    || /^\s*export\s+(?:type\s+)?\{/.test(line)
    || /^\s*(?:type\s+)?[A-Za-z_]\w*\s+as\s[A-Za-z_]\w*,?\s*$/.test(line);
};

// Offsets preserved so reported lines stay correct.
const blankSpan = (match: string): string => {
  return match.replace(/[^\n]/g, ' ');
};

// One pass, so whichever opens first owns the span and unmatched prose backticks cannot span the file.
const MULTILINE_SPAN = /\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^`\\])*`/g;

const blankMultilineSpans = (content: string): string => {
  return content.replace(MULTILINE_SPAN, blankSpan);
};

// A block directive sits on its comment's first line, so only that line is kept for the comment patterns.
const keepBlockCommentHeads = (content: string): string => {
  return content
    .replace(MULTILINE_SPAN, (match) => {
      return match.startsWith('/*') ? match.replace(/\n[\s\S]*/, blankSpan) : blankSpan(match);
    });
};

// Strings blanked, comments kept: stripping comments hides every directive.
const stripStrings = (line: string): string => {
  return line
    .replace(/\\['"]/g, blankSpan)
    .replace(/'[^']*'|"[^"]*"/g, blankSpan);
};

const stripStringsAndComments = (line: string): string => {
  return stripStrings(line).replace(/\/\/.*/, '');
};

const SCRIPT_FILE = /\.[cm]?tsx?$/;
const SFC_FILE = /\.(?:vue|svelte)$/;
const SFC_SCRIPT_BLOCK = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/i;

// What split answers per block: the text before it, its open tag, its body, its close tag.
const SFC_PARTS = 4;
const SFC_BODY = 2;

// Line numbers preserved.
const scriptBlocksOnly = (content: string): string => {
  return content
    .split(SFC_SCRIPT_BLOCK)
    .map((part, index) => {
      return index % SFC_PARTS === SFC_BODY ? part : blankSpan(part);
    })
    .join('');
};

const filesUnder = (path: string, extensions: string[]): string[] => {
  if (statSync(path, { throwIfNoEntry: false })?.isDirectory() !== true) {
    const file = [path];

    return file;
  }

  const patterns = extensions
    .map((extension) => {
      return `**/*${extension}`;
    });

  // A glob skips dot-directories by default.
  return globSync(patterns, {
    cwd: path,
    exclude: ['**/node_modules'],
  })
    .map((file) => {
      return join(path, file);
    });
};

const hitsIn = (content: string, sfc: boolean, patterns: BannedPattern[]): string[] => {
  const scripts = sfc ? scriptBlocksOnly(content) : content;
  const code = blankMultilineSpans(scripts);
  const comments = keepBlockCommentHeads(scripts);
  const hits: string[] = [];
  // Every view keeps the content's offsets, so one line's span reads the same line in each.
  let start = 0;

  for (const [index, line] of content
    .split('\n')
    .entries()) {
    const end = start + line.length;
    const scrubbed = stripStringsAndComments(code.slice(start, end));
    const withComments = stripStrings(comments.slice(start, end));

    start = end + 1;

    const match = patterns
      .find((pattern) => {
        const subject = pattern.inComments === true ? withComments : scrubbed;

        return pattern.re.test(subject) && !pattern.allowed
          ?.some((shape) => {
            return shape.test(subject);
          });
      });

    if (match !== undefined && !isAliasOrImportLine(line)) {
      hits.push(`${String(index + 1)}: ${line.trim()}  [${match.name}]`);
    }
  }

  return hits;
};

const contentOf = (file: string): string | null => {
  try {
    return readFileSync(file, 'utf8');
  }
  catch {
    return null;
  }
};

// One report per file with a hit.
export const bannedReports = (paths: string[], scan: BannedScan): string[] => {
  const reports: string[] = [];

  for (const file of paths
    .flatMap((path) => {
      return filesUnder(path, scan.extensions);
    })) {
    const sfc = SFC_FILE.test(file);
    const content = (sfc || SCRIPT_FILE.test(file)) && !isSkipped(file, scan.skipped) ? contentOf(file) : null;
    const hits = content === null ? [] : hitsIn(content, sfc, scan.patterns);

    if (hits.length > 0) {
      reports.push(`Banned pattern in ${file}:\n  ${hits.join('\n  ')}`);
    }
  }

  return reports;
};

export const checkBanned = (paths: string[], scan: BannedScan): number => {
  const reports = bannedReports(paths, scan);

  if (reports.length === 0) {
    return 0;
  }

  for (const report of reports) {
    logError(report);
  }

  logError('Fix the source: build the real type, from its owner. See type-standards.md under plugins/linteljs/.');

  return 1;
};
