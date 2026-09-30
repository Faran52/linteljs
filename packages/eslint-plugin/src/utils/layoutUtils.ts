import {
  type Fixer,
  mustFind,
  type RuleNode,
  type SourceCode,
} from './ruleUtils.ts';

import type { AST, Rule } from 'eslint';

export interface Located {
  loc?: AST.Token['loc'] | null | undefined;
}

export interface SpliceAnchor extends Located {
  range?: AST.Range | undefined;
}

export interface Indents {
  outer: string;
  inner: string;
}

// `getLastToken` takes any ESTree node, which an array's elements are and `RuleNode` is not.
type ListItem = Parameters<SourceCode['getLastToken']>[0] | null;

// Each break a one-per-line list needs: before and after the brace or bracket, and between its items.
export type ListGap = [SpliceAnchor, SpliceAnchor, string];

const MAX_SANE_INDENT = 8;

const MIN_SANE_INDENT = 2;

// Carries the previous item forward, since `items[index - 1]` is a possibly-missing read.
export const adjacentPairs = function* <T>(items: T[]): IterableIterator<[T, T]> {
  let previous: T | undefined;

  for (const item of items) {
    if (previous !== undefined) {
      yield [previous, item];
    }

    previous = item;
  }
};

// Two absent locations should not read as a match a fixer would rewrite.
export const sameLine = (
  before: Located | null | undefined,
  after: Located | null | undefined,
): boolean => {
  const end = before?.loc?.end.line;

  return end !== undefined && end === after?.loc?.start.line;
};

// Token lookups skip comments, so a range a fixer is about to replace can still hold one.
export const gapIsBlank = (sourceCode: SourceCode, from: number, to: number): boolean => {
  return sourceCode.text
    .slice(from, to)
    .trim().length === 0;
};

// Reads the line's indentation, not the node's column: an ObjectPattern starts after `const `.
export const getIndent = (sourceCode: SourceCode, node: Located): string => {
  const { start } = mustFind(node.loc);
  const line = mustFind(sourceCode.lines[start.line - 1]);

  return line.replace(/[^\t ][\s\S]*/u, '');
};

// The file's majority: always writing \n mixes a CRLF repo, and one stray CRLF line must not convert an LF file.
export const lineTerminatorOf = (sourceCode: SourceCode): string => {
  const crlf = sourceCode.text.split('\r\n').length - 1;
  const lf = sourceCode.text.split('\n').length - 1 - crlf;

  return crlf > 0 && crlf >= lf ? '\r\n' : '\n';
};

// Lines inside a multi-line token (a template body) are content, not indentation, so the indent scan skips them.
// Both ends included; empty when `last` falls before `first`.
export const lineSpan = (first: number, last: number): number[] => {
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, offset) => {
    return first + offset;
  });
};

export const linesInsideTokens = (sourceCode: SourceCode): Set<number> => {
  const inside = new Set<number>();

  for (const { loc } of sourceCode.ast.tokens) {
    for (const line of lineSpan(loc.start.line + 1, loc.end.line)) {
      inside.add(line);
    }
  }

  return inside;
};

// JSDoc ` * ` continuation lines are excluded so they don't skew it to one space.
export const getIndentStep = (sourceCode: SourceCode): string => {
  const widths = new Set<number>();
  const inside = linesInsideTokens(sourceCode);
  let tabbed = 0;
  let spaced = 0;

  for (const [index, line] of sourceCode.lines.entries()) {
    const match = /^([\t ]+)([^\s*])/.exec(line);

    if (!match?.[1] || inside.has(index + 1)) {
      continue;
    }

    if (match[1].startsWith('\t')) {
      tabbed += 1;
      continue;
    }

    spaced += 1;
    widths.add(match[1].length);
  }

  if (tabbed > 0 && tabbed >= spaced) {
    return '\t';
  }

  // `Infinity` for a file with no spaced line, which the ceiling sends to the floor.
  const narrowest = Math.min(...widths);

  return ' '.repeat(narrowest <= MAX_SANE_INDENT ? Math.max(narrowest, MIN_SANE_INDENT) : MIN_SANE_INDENT);
};

// Read once, so a brace and its members share one scale.
export const indentReader = (sourceCode: SourceCode): ((node: RuleNode) => Indents) => {
  const step = getIndentStep(sourceCode);

  return (node) => {
    const outer = getIndent(sourceCode, node);

    return {
      outer,
      inner: `${outer}${step}`,
    };
  };
};

// A gap across lines is the caller's layout, not ours to collapse.
export const spliceOntoNewline = function* (
  fixer: Fixer,
  before: SpliceAnchor | null | undefined,
  after: SpliceAnchor | null | undefined,
  indent: string,
  eol: string,
): IterableIterator<Rule.Fix> {
  if (before?.loc?.end.line === after?.loc?.start.line && before?.range && after?.range) {
    yield fixer.replaceTextRange([before.range[1], after.range[0]], `${eol}${indent}`);
  }
};

const COMMENTS = { includeComments: true };

// A parenthesised array element ends before its `)`.
const PAST_PARENS = {
  filter: (token: AST.Token) => {
    return token.value !== ')';
  },
};

// A same-line comment after a separator trails the item before it, so the break goes after the comment.
const trailingEnd = (sourceCode: SourceCode, token: AST.Token) => {
  let trailing;

  for (const comment of sourceCode.getCommentsAfter(token)) {
    if (!sameLine(token, comment)) {
      break;
    }

    trailing = comment;
  }

  return trailing ?? token;
};

// `open` is the brace or bracket, which an export reaches past `export type`. `commaSeparated` is false for a
// TypeScript member, which carries its own `;` or `,`. A hole is a null item.
export const listGaps = (
  sourceCode: SourceCode,
  open: AST.Token,
  items: ListItem[],
  { outer, inner }: Indents,
  commaSeparated: boolean,
): ListGap[] => {
  const ends: AST.Token[] = [];
  let cursor = open;

  for (const item of items) {
    const last = item ? mustFind(sourceCode.getLastToken(item)) : cursor;

    cursor = commaSeparated ? mustFind(sourceCode.getTokenAfter(last, PAST_PARENS)) : last;
    ends.push(cursor);
  }

  // Found from the last item, not the node, since a pattern's type annotation comes after its brace.
  const close = cursor.value === ',' || !commaSeparated ? mustFind(sourceCode.getTokenAfter(cursor)) : cursor;

  return [
    [
      open,
      mustFind(sourceCode.getTokenAfter(open, COMMENTS)),
      inner,
    ],
    ...ends
      .slice(0, -1)
      .map((end): ListGap => {
        const anchor = trailingEnd(sourceCode, end);

        return [
          anchor,
          mustFind(sourceCode.getTokenAfter(anchor, COMMENTS)),
          inner,
        ];
      }),
    [
      mustFind(sourceCode.getTokenBefore(close, COMMENTS)),
      close,
      outer,
    ],
  ];
};

// Crowded: over `maxInline` items on one line. Half-split: some breaks made and some not. Neither gives none.
export const gapsToBreak = (gaps: ListGap[], maxInline: number): ListGap[] => {
  const onOneLine = gaps
    .filter(([before, after]) => {
      return sameLine(before, after);
    });
  // A list of n items has n + 1 gaps.
  const itemCount = gaps.length - 1;

  return onOneLine.length === gaps.length && itemCount <= maxInline ? [] : onOneLine;
};

export const breakGaps = (gaps: ListGap[], eol: string) => {
  return function* (fixer: Fixer): IterableIterator<Rule.Fix> {
    for (const [
      before,
      after,
      indent,
    ] of gaps) {
      yield* spliceOntoNewline(fixer, before, after, indent, eol);
    }
  };
};
