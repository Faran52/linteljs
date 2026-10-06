import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

import { maxBy } from 'es-toolkit';

import {
  nameFor,
  parse,
  parseOrNull,
  type Program,
  type Token,
} from '../../utils/astUtils.ts';
import { messageOf } from '../../utils/corpusUtils.ts';
import { HUNK_CONTEXT_LINES, REPRODUCTION_PADS } from '../constants.ts';

import {
  commentDiff,
  commentMoveDiff,
  endingsDiff,
  multisetDiff,
  orderedDiff,
} from './diffUtils.ts';
import {
  fix,
  parsedFix,
  pluginConfig,
  subsetOf,
} from './fixUtils.ts';

import type { AuditContext } from '../types.ts';
import type { Finding } from './reportShapeUtils.ts';
import type { Dominant } from './timingUtils.ts';

type Diff = (before: Token[], after: Token[]) => string | undefined;

interface Evaluation {
  changed: boolean;
  findings: Finding[];
  fixed: string;
}

const ORDERED_RULES = [
  'export-specifier-newline',
  'import-newlines',
  'member-newline',
  'union-newline',
];

const MOVE_RULES = [
  ...ORDERED_RULES,
  'interface-order',
  'sort-hook-dependencies',
];

const attributeTokens = (
  context: AuditContext,
  source: string,
  tokens: Token[],
  name: string,
  names: string[],
): Finding | undefined => {
  const scopes: [Diff, string[]][] = [
    [orderedDiff, subsetOf(ORDERED_RULES, names)],
    [multisetDiff, subsetOf(MOVE_RULES, names)],
  ];

  for (const [diff, subset] of scopes) {
    const breaks = (rules: string[]): string | undefined => {
      const after = parsedFix(context, source, name, rules);

      return after ? diff(tokens, after.tokens) : undefined;
    };

    const detail = breaks(subset);

    if (detail !== undefined) {
      const culprits = subset
        .filter((rule) => {
          return breaks([rule]) !== undefined;
        });

      const tokenLoss = {
        category: 'token loss',
        rules: culprits.length > 0 ? culprits : subset,
        detail,
      };

      return tokenLoss;
    }
  }

  return undefined;
};

// Only whitespace fixers: `prefer-arrow-functions` moves which name sits nearest an untouched comment.
const attributeCommentMoves = (
  context: AuditContext,
  source: string,
  ast: Program,
  name: string,
  names: string[],
): Finding | undefined => {
  const subset = subsetOf(ORDERED_RULES, names);

  const moves = (rules: string[]): string | undefined => {
    const after = parsedFix(context, source, name, rules);

    return after ? commentMoveDiff(ast, after) : undefined;
  };

  const detail = moves(subset);

  if (detail === undefined) {
    return undefined;
  }

  const culprits = subset
    .filter((rule) => {
      return moves([rule]) !== undefined;
    });

  const commentMove = {
    category: 'comment moved',
    rules: culprits.length > 0 ? culprits : subset,
    detail,
  };

  return commentMove;
};

const inspect = (
  context: AuditContext,
  source: string,
  ast: Program,
  fixed: string,
  name: string,
  names: string[],
): Finding[] => {
  const after = parseOrNull(fixed, name);

  if (!after) {
    let detail = 'output does not parse';

    try {
      parse(fixed, name);
    }
    catch (error) {
      detail = messageOf(error);
    }

    const unparseable = [{
      category: 'unparseable',
      rules: names,
      detail,
    }];

    return unparseable;
  }

  const comments = commentDiff(ast.comments, after.comments);
  const endings = endingsDiff(source, fixed);

  const findings = [
    fix(context, fixed, name, names) === fixed
      ? undefined
      : {
          category: 'non-convergent',
          rules: names,
          detail: 'a second --fix pass changed it again',
        },
    orderedDiff(ast.tokens, after.tokens) === undefined
      ? undefined
      : attributeTokens(context, source, ast.tokens, name, names),
    comments === undefined
      ? undefined
      : {
          category: 'comment loss',
          rules: names,
          detail: comments,
        },
    commentMoveDiff(ast, after) === undefined ? undefined : attributeCommentMoves(context, source, ast, name, names),
    endings === undefined
      ? undefined
      : {
          category: 'line-ending change',
          rules: names,
          detail: endings,
        },
  ]
    .filter((finding) => {
      return finding !== undefined;
    });

  return findings;
};

export const evaluate = (
  context: AuditContext,
  source: string,
  name: string,
  names: string[],
  parsed?: Program,
): Evaluation => {
  const ast = parsed ?? parseOrNull(source, name);
  const fixed = ast ? fix(context, source, name, names) : source;

  const evaluation = {
    changed: fixed !== source,
    findings: ast && fixed !== source ? inspect(context, source, ast, fixed, name, names) : [],
    fixed,
  };

  return evaluation;
};

const lineOf = (text: string, offset: number): number => {
  return text
    .slice(0, offset)
    .split('\n').length - 1;
};

const changedLines = (source: string, fixed: string): [number, number] => {
  let start = 0;

  while (start < source.length && source[start] === fixed[start]) {
    start += 1;
  }

  let back = 0;

  while (back < source.length - start && back < fixed.length - start
    && source[source.length - 1 - back] === fixed[fixed.length - 1 - back]) {
    back += 1;
  }

  const changed: [number, number] = [lineOf(source, start), lineOf(source, source.length - back)];

  return changed;
};

// A two-line slice rarely parses on its own.
export const narrow = (
  context: AuditContext,
  source: string,
  fixed: string,
  name: string,
  finding: Finding,
): [string, string] => {
  const lines = source.split('\n');
  const [first, last] = changedLines(source, fixed);

  const slice = (pad: number): string => {
    const from = Math.max(0, first - pad);
    const to = Math.min(lines.length, last + pad + 1);

    return `${lines
      .slice(from, to)
      .join('\n')}\n`;
  };

  for (const pad of REPRODUCTION_PADS) {
    const padded = slice(pad);
    const reproduces = evaluate(context, padded, name, finding.rules).findings
      .some((candidate) => {
        return candidate.category === finding.category;
      });

    if (reproduces) {
      const reproduction: [string, string] = [padded, 'minimal reproduction'];

      return reproduction;
    }
  }

  const hunk: [string, string] = [slice(HUNK_CONTEXT_LINES), 'changed hunk, could not narrow'];

  return hunk;
};

export const attribute = (
  context: AuditContext,
  source: string,
  name: string,
  names: string[],
  category: string,
): string[] => {
  return names
    .filter((rule) => {
      return evaluate(context, source, name, [rule]).findings
        .some((finding) => {
          return finding.category === category;
        });
    });
};

// An empty pass subtracted, since the parse is most of a large file's cost.
export const dominantRule = (context: AuditContext, file: string): Dominant => {
  const source = readFileSync(file, 'utf8');
  const name = nameFor(file, source);

  const timed = (names: string[]): number => {
    const started = performance.now();

    context.linter.verifyAndFix(source, pluginConfig(context, names), name);

    return performance.now() - started;
  };

  // The first pass carries the linter's warm-up, which a baseline would subtract from every rule.
  timed([]);

  const baseline = timed([]);

  const rows = context.activeRules
    .map((rule) => {
      const row = {
        baseline,
        ms: timed([rule]) - baseline,
        rule,
      };

      return row;
    });
  const none = {
    baseline,
    ms: -Infinity,
    rule: 'none',
  };

  return maxBy(rows, (row) => {
    return row.ms;
  }) ?? none;
};
