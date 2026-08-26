import {
  type Fixer,
  mustFind,
  type RuleNode,
  type SourceCode,
} from './ruleUtils.ts';

import type { AST, Rule } from 'eslint';

// Anything the parse gave a position to: a token, comment or node; naming it keeps the helpers cast-free.
export interface Located {
  loc?: AST.Token['loc'] | null | undefined;
}

// Either end of a gap a layout fixer rewrites, which it needs offsets for.
export interface SpliceAnchor extends Located {
  range?: AST.Range | undefined;
}

// The column a block sits at, and one step further in.
export interface Indents {
  outer: string;
  inner: string;
}

const MAX_SANE_INDENT = 8;

const MIN_SANE_INDENT = 2;

// Carries the previous item forward rather than indexing back, since items[index - 1] can be a possibly-missing read.
export const adjacentPairs = function* <T>(items: T[]): IterableIterator<[T, T]> {
  let previous: T | undefined;

  for (const item of items) {
    if (previous !== undefined) {
      yield [previous, item];
    }

    previous = item;
  }
};

// A missing side answers false: two absent locations should not read as a match a fixer would rewrite.
export const sameLine = (
  before: Located | null | undefined,
  after: Located | null | undefined,
): boolean => {
  const end = before?.loc?.end.line;

  return end !== undefined && end === after?.loc?.start.line;
};

// Token lookups skip comments, so a range a fixer is about to replace can still hold one.
export const gapIsBlank = (sourceCode: SourceCode, from: number, to: number): boolean => {
  return sourceCode.text.slice(from, to).trim().length === 0;
};

// Reads the line's indentation, not the node's column: an ObjectPattern starts after `const `.
export const getIndent = (sourceCode: SourceCode, node: RuleNode): string => {
  /* v8 ignore next 3 -- a parsed node always carries a location */
  if (!node.loc) {
    return '';
  }

  /* v8 ignore next 1 -- the line a node starts on is always present in sourceCode.lines */
  const line = sourceCode.lines[node.loc.start.line - 1] ?? '';

  /* v8 ignore next 1 -- the pattern matches any string, including an empty one */
  return /^[\t ]*/.exec(line)?.[0] ?? '';
};

// A fixer that always writes \n leaves a CRLF repo with mixed endings, a permanently dirty diff on Windows.
export const lineTerminatorOf = (sourceCode: SourceCode): string => {
  return sourceCode.text.includes('\r\n') ? '\r\n' : '\n';
};

// Lines inside a multi-line token (a template body) are content, not indentation, so the indent scan skips them.
const linesInsideTokens = (sourceCode: SourceCode): Set<number> => {
  const inside = new Set<number>();

  for (const { loc } of sourceCode.ast.tokens) {
    for (let line = loc.start.line + 1; line <= loc.end.line; line++) {
      inside.add(line);
    }
  }

  return inside;
};

// One indentation step read off the file: narrowest indent wins, tabs win on a tie, and JSDoc
// ` * ` continuation lines are excluded so they don't skew it to one space.
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

  const narrowest = [...widths].sort((first, second) => {
    return first - second;
  })[0];

  // >= and > are equivalent here since the floor equals the fallback width; no test can separate them, not a defect.
  const usable = narrowest !== undefined && narrowest >= MIN_SANE_INDENT && narrowest <= MAX_SANE_INDENT;

  return ' '.repeat(usable ? narrowest : MIN_SANE_INDENT);
};

// Reads the file's indent step once rather than per node, so a brace and its members share one scale.
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

// Yields nothing when the anchors sit on different lines: that gap is the caller's layout, not ours to collapse.
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

// Null when anything is written in the gap: reflowing over a comment there would delete it silently.
export const fixCommaToNewline = (
  sourceCode: SourceCode,
  fixer: Fixer,
  currentToken: AST.Token,
  indent = '',
): Rule.Fix | null => {
  const comma = mustFind(sourceCode.getTokenBefore(currentToken));

  const rangeAfterComma: [number, number] = [comma.range[1], currentToken.range[0]];

  if (!gapIsBlank(sourceCode, rangeAfterComma[0], rangeAfterComma[1])) {
    return null;
  }

  return fixer.replaceTextRange(rangeAfterComma, `${lineTerminatorOf(sourceCode)}${indent}`);
};
