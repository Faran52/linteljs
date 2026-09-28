import {
  type Fixer,
  mustFind,
  rangeOf,
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

// The whole line counts: a collapse a length rule cannot satisfy is an unfixable error.
export const fitsOnLine = (
  sourceCode: SourceCode,
  node: RuleNode,
  text: string,
  limit: number,
): boolean => {
  const [start, end] = rangeOf(node);
  const before = start - (sourceCode.text.lastIndexOf('\n', start - 1) + 1);
  const newlineAfter = sourceCode.text.indexOf('\n', end);
  const after = (newlineAfter === -1 ? sourceCode.text.length : newlineAfter) - end;

  return before + text.length + after <= limit;
};

// The file's majority: always writing \n mixes a CRLF repo, and one stray CRLF line must not convert an LF file.
export const lineTerminatorOf = (sourceCode: SourceCode): string => {
  const crlf = sourceCode.text.split('\r\n').length - 1;
  const lf = sourceCode.text.split('\n').length - 1 - crlf;

  return crlf > 0 && crlf >= lf ? '\r\n' : '\n';
};

// Lines inside a multi-line token (a template body) are content, not indentation, so the indent scan skips them.
export const linesInsideTokens = (sourceCode: SourceCode): Set<number> => {
  const inside = new Set<number>();

  for (const { loc } of sourceCode.ast.tokens) {
    for (let line = loc.start.line + 1; line <= loc.end.line; line++) {
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

export const commaToNewline = (
  sourceCode: SourceCode,
  fixer: Fixer,
  currentToken: AST.Token,
  indent: string,
): Rule.Fix => {
  const comma = mustFind(sourceCode.getTokenBefore(currentToken));

  return fixer.replaceTextRange([comma.range[1], currentToken.range[0]], `${lineTerminatorOf(sourceCode)}${indent}`);
};
