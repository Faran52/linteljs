import { countBy } from 'es-toolkit';

import { countMatches } from './corpusUtils.ts';

import type { Token } from './astUtils.ts';

interface Parsed {
  tokens: Token[];
  comments: Token[];
}

const CLOSERS = new Set([')', '}', ']', '>']);
const OPENERS = new Set(['{', '(', '[']);
const BLOCK_CLOSERS = new Set(['}', ')', ']']);

export const describeToken = (token: Token): string => {
  return `${token.type} ${JSON.stringify(token.value)}`;
};

// Trailing commas dropped: collapsing a list takes one with it, and a missing separator would fail to parse first.
const comparable = (tokens: Token[]): Token[] => {
  return tokens.filter((token, index) => {
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

// Order-blind: what is left after a rule allowed to move members.
const missingFrom = <T>(before: T[], after: T[], keyOf: (item: T) => string, noun: string): string | undefined => {
  const produced = countBy(after, keyOf);

  for (const [key, count] of Object.entries(countBy(before, keyOf))) {
    const kept = produced[key] ?? 0;

    if (kept < count) {
      return `${noun} ${key} appears ${String(count)} time(s) in the input and ${String(kept)} in the output`;
    }
  }

  return undefined;
};

export const multisetDiff = (before: Token[], after: Token[]): string | undefined => {
  return missingFrom(comparable(before), comparable(after), describeToken, 'token');
};

// A block's leading `*` is delimiter, so `comment-delimiter` turning `//` lines into a block is not a loss.
const contentLinesOf = (comments: Token[]): string[] => {
  return comments.flatMap((comment) => {
    return comment.value.split('\n').map((line) => {
      const trimmed = line.trim();

      return comment.type === 'Block' && trimmed.startsWith('*') ? trimmed.slice(1).trim() : trimmed;
    }).filter((line) => {
      return line !== '';
    });
  });
};

export const commentDiff = (before: Token[], after: Token[]): string | undefined => {
  return missingFrom(contentLinesOf(before), contentLinesOf(after), (line) => {
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

// Stops at a closing bracket: past it are the next construct's names, not what a last note in a block is about.
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

/**
 * What each comment is written against. Text alone cannot see a note that moved, which is how a 1.0.1 fix walked
 * every trailing note onto the field below. A note trails the code before it on its line, and otherwise heads what
 * follows; only that side goes into the key, so a declaration moving with its note is not a move.
 */
const commentAnchors = ({ tokens, comments }: Parsed): string[] => {
  let index = 0;

  return comments.map((comment) => {
    while (index < tokens.length && (tokens[index]?.range[1] ?? Infinity) <= comment.range[0]) {
      index += 1;
    }

    const previous = tokens.at(index - 1);
    const trails = index > 0 && previous?.loc.end.line === comment.loc.start.line
      && !OPENERS.has(previous.value);
    const heads = trails ? undefined : nameAfter(tokens, index);
    const anchor = heads ?? nameBefore(tokens, index - 1);

    return `${JSON.stringify(comment.value)} written ${heads ? 'before' : 'after'} `
      + (anchor ? describeToken(anchor) : 'no name');
  });
};

export const commentMoveDiff = (before: Parsed, after: Parsed): string | undefined => {
  return missingFrom(commentAnchors(before), commentAnchors(after), (key) => {
    return key;
  }, 'comment');
};

export const endingsDiff = (source: string, fixed: string): string | undefined => {
  const bareBefore = countMatches(source, /(?<!\r)\n/g);
  const bareAfter = countMatches(fixed, /(?<!\r)\n/g);
  const crlfBefore = countMatches(source, /\r\n/g);
  const crlfAfter = countMatches(fixed, /\r\n/g);

  if (crlfBefore > 0 && bareAfter > bareBefore) {
    return `CRLF file gained ${String(bareAfter - bareBefore)} bare LF line ending(s)`;
  }

  return crlfBefore === 0 && crlfAfter > 0 ? `LF file gained ${String(crlfAfter)} CRLF line ending(s)` : undefined;
};
