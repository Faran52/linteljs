import { countBy } from 'es-toolkit';

import { countMatches } from '../../utils/corpusUtils.ts';

import type { Token } from '../../utils/astUtils.ts';

interface Parsed {
  tokens: Token[];
  comments: Token[];
}

const CLOSERS = new Set([
  ')',
  '}',
  ']',
  '>',
]);
const OPENERS = new Set([
  '{',
  '(',
  '[',
]);
const BLOCK_CLOSERS = new Set([
  '}',
  ')',
  ']',
]);

const describeToken = (token: Token): string => {
  return `${token.type} ${JSON.stringify(token.value)}`;
};

// Trailing commas dropped: collapsing a list takes one with it.
const comparable = (tokens: Token[]): Token[] => {
  return tokens
    .filter((token, index) => {
      const next = tokens.at(index + 1);

      return !(token.value === ',' && next !== undefined && CLOSERS.has(next.value));
    });
};

export const orderedDiff = (beforeTokens: Token[], afterTokens: Token[]): string | undefined => {
  const before = comparable(beforeTokens);
  const after = comparable(afterTokens);

  for (const [index, original] of before.entries()) {
    const produced = after.at(index);

    if (produced === undefined) {
      return `output ends after ${String(after.length)} tokens, input had ${String(before.length)}, `
        + `first missing ${describeToken(original)}`;
    }

    if (original.type !== produced.type || original.value !== produced.value) {
      return `token ${String(index)} was ${describeToken(original)} and is now ${describeToken(produced)}`;
    }
  }

  return undefined;
};

const missingFrom = <T>(before: T[], after: T[], keyOf: (item: T) => string, noun: string): string | undefined => {
  const produced = countBy(after, keyOf);
  const consumed = countBy(before, keyOf);

  for (const [key, count] of Object.entries(consumed)) {
    const kept = produced[key] ?? 0;

    if (kept < count) {
      return `${noun} ${key} appears ${String(count)} time(s) in the input and ${String(kept)} in the output`;
    }
  }

  return undefined;
};

export const multisetDiff = (before: Token[], after: Token[]): string | undefined => {
  const input = comparable(before);
  const output = comparable(after);

  return missingFrom(input, output, describeToken, 'token');
};

// A block's leading `*` is delimiter, so `comment-delimiter` turning `//` lines into a block is not a loss.
const contentLinesOf = (comments: Token[]): string[] => {
  return comments
    .flatMap((comment) => {
      return comment.value
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();

          return comment.type === 'Block' && trimmed.startsWith('*')
            ? trimmed
                .slice(1)
                .trim()
            : trimmed;
        })
        .filter((line) => {
          return line !== '';
        });
    });
};

export const commentDiff = (before: Token[], after: Token[]): string | undefined => {
  const input = contentLinesOf(before);
  const output = contentLinesOf(after);

  return missingFrom(input, output, (line) => {
    return JSON.stringify(line);
  }, 'comment line');
};

// The nearest name, since `prefer-arrow-functions` changes the token under a doc comment and never a name.
const nameBefore = (tokens: Token[], from: number): Token | undefined => {
  for (let index = from; index >= 0; index -= 1) {
    const token = tokens[index];

    if (token?.type === 'Identifier') {
      return token;
    }
  }

  return undefined;
};

const nameAfter = (tokens: Token[], from: number): Token | undefined => {
  for (let index = from; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === undefined || BLOCK_CLOSERS.has(token.value)) {
      return undefined;
    }

    if (token.type === 'Identifier') {
      return token;
    }
  }

  return undefined;
};

// Past the end, the missing token reads as Infinity and stops the scan.
const firstTokenEndingAfter = (tokens: Token[], from: number, start: number): number => {
  let index = from;

  while ((tokens[index]?.range[1] ?? Infinity) <= start) {
    index += 1;
  }

  return index;
};

const trailsPrevious = (tokens: Token[], index: number, comment: Token): boolean => {
  const previous = tokens.at(index - 1);

  return index > 0 && previous?.loc.end.line === comment.loc.start.line && !OPENERS.has(previous.value);
};

const describeAnchor = (anchor: Token | undefined): string => {
  return anchor ? describeToken(anchor) : 'no name';
};

// Text alone cannot see a trailing note that moved down a line.
const commentAnchors = ({ tokens, comments }: Parsed): string[] => {
  let index = 0;

  return comments
    .map((comment) => {
      index = firstTokenEndingAfter(tokens, index, comment.range[0]);

      const heads = trailsPrevious(tokens, index, comment) ? undefined : nameAfter(tokens, index);
      const anchor = heads ?? nameBefore(tokens, index - 1);

      return `${JSON.stringify(comment.value)} written ${heads ? 'before' : 'after'} ${describeAnchor(anchor)}`;
    });
};

export const commentMoveDiff = (before: Parsed, after: Parsed): string | undefined => {
  const input = commentAnchors(before);
  const output = commentAnchors(after);

  return missingFrom(input, output, (key) => {
    return key;
  }, 'comment');
};

export const endingsDiff = (source: string, fixed: string): string | undefined => {
  const bareBefore = countMatches(source, /(?<!\r)\n/g);
  const bareAfter = countMatches(fixed, /(?<!\r)\n/g);
  const crlfBefore = countMatches(source, /\r\n/g);
  const crlfAfter = countMatches(fixed, /\r\n/g);

  // By majority, as `lineTerminatorOf` decides: one stray CRLF line leaves an LF file LF.
  const crlfFile = crlfBefore > 0 && crlfBefore >= bareBefore;

  if (crlfFile && bareAfter > bareBefore) {
    return `CRLF file gained ${String(bareAfter - bareBefore)} bare LF line ending(s)`;
  }

  return !crlfFile && crlfAfter > crlfBefore
    ? `LF file gained ${String(crlfAfter - crlfBefore)} CRLF line ending(s)`
    : undefined;
};
