import {
  describe,
  expect,
  it,
} from 'vitest';

import { parse } from '../../utils/astUtils.ts';

import {
  commentDiff,
  commentMoveDiff,
  endingsDiff,
  multisetDiff,
  orderedDiff,
} from './diffUtils.ts';

const parsed = (source: string): ReturnType<typeof parse> => {
  const program = parse(source, 'file.ts');

  return program;
};

const lost = (what: string, count = 1, kept = 0): string => {
  const message = `${what} appears ${String(count)} time(s) in the input and ${String(kept)} in the output`;

  return message;
};

describe('orderedDiff', () => {
  it.each([
    [
      'the same tokens, a trailing comma before a closer ignored',
      'f(a, b,);\n[1, 2,];\n',
      'f(a, b);\n[1, 2];\n',
    ],
    [
      'an output that only adds tokens',
      'a;',
      'a; b;',
    ],
  ])('accepts %s', (_label, before, after) => {
    const diff = orderedDiff(parsed(before).tokens, parsed(after).tokens);

    expect(diff).toBeUndefined();
  });

  it.each([
    [
      'a comma before a non-closer',
      'f(a, b);',
      'f(a + b);',
      'token 3 was Punctuator "," and is now Punctuator "+"',
    ],
    [
      'a changed type',
      'a;',
      '"a";',
      'token 0 was Identifier "a" and is now String "\\"a\\""',
    ],
    [
      'a changed value',
      'a + b;',
      'a - b;',
      'token 1 was Punctuator "+" and is now Punctuator "-"',
    ],
    [
      'a lost token',
      'a; b;',
      'a;',
      'output ends after 2 tokens, input had 4, first missing Identifier "b"',
    ],
  ])('names %s', (_label, before, after, expected) => {
    const diff = orderedDiff(parsed(before).tokens, parsed(after).tokens);

    expect(diff).toBe(expected);
  });
});

describe('multisetDiff', () => {
  it.each([
    [
      'the same tokens in another order',
      'a; b;',
      'b; a;',
      undefined,
    ],
    [
      'a trailing comma the output dropped',
      'f(a,);',
      'f(a);',
      undefined,
    ],
    [
      'a token the output lost once',
      'a; a; b;',
      'a; b; c;',
      lost('token Identifier "a"', 2, 1),
    ],
    [
      'a token the output dropped entirely',
      'b;',
      'a;',
      lost('token Identifier "b"'),
    ],
  ])('judges %s', (_label, before, after, expected) => {
    const diff = multisetDiff(parsed(before).tokens, parsed(after).tokens);

    expect(diff).toBe(expected);
  });
});

describe('commentDiff', () => {
  it.each([
    [
      'line comments turned into a starred block',
      '// one\n// two\na;\n',
      '/*\n * one\n * two\n */\na;\n',
      undefined,
    ],
    [
      'a lost comment line',
      '// one\n// two\na;\n',
      '// one\na;\n',
      lost('comment line "two"'),
    ],
    [
      'a leading star in a line comment',
      '// * one\na;\n',
      '/* one */\na;\n',
      lost('comment line "* one"'),
    ],
  ])('judges %s', (_label, before, after, expected) => {
    const diff = commentDiff(parsed(before).comments, parsed(after).comments);

    expect(diff).toBe(expected);
  });
});

describe('commentMoveDiff', () => {
  it.each([
    [
      'a doc comment that still heads its name',
      '/** doc */\nfunction a() {}\n',
      '/** doc */\nconst a = () => {};\n',
      undefined,
    ],
    [
      'a comment after an opener',
      'f({ // note\n  a,\n});\n',
      'f({\n  // note\n  a,\n});\n',
      undefined,
    ],
    [
      'a trailing note moved down a line',
      'const a = 1; // note\nconst b = 2;\n',
      'const a = 1;\n// note\nconst b = 2;\n',
      lost('comment " note" written after Identifier "a"'),
    ],
    [
      'a comment with no name after it',
      'f(a, () => { // note\n});\n',
      'f(b, () => { // note\n});\n',
      lost('comment " note" written after Identifier "a"'),
    ],
    [
      'a comment ending the file',
      'a;\n// end\n',
      '// end\na;\n',
      lost('comment " end" written after Identifier "a"'),
    ],
    [
      'a file without names',
      '// end\n',
      '/* end */\n',
      lost('comment " end" written after no name'),
    ],
    [
      'a comment heading the file',
      '// head\na;\n',
      'a;\n// head\n',
      lost('comment " head" written before Identifier "a"'),
    ],
  ])('judges %s', (_label, before, after, expected) => {
    const diff = commentMoveDiff(parsed(before), parsed(after));

    expect(diff).toBe(expected);
  });
});

describe('endingsDiff', () => {
  it.each([
    [
      'an LF file kept LF',
      'a\nb\n',
      'a\nb\nc\n',
      undefined,
    ],
    [
      'a CRLF file kept CRLF',
      'a\r\nb\r\n',
      'a\r\nb\r\nc\r\n',
      undefined,
    ],
    [
      'a CRLF file that gained bare LF',
      'a\r\nb\r\n',
      'a\r\nb\nc\n',
      'CRLF file gained 2 bare LF line ending(s)',
    ],
    [
      'an LF file that gained CRLF',
      'a\nb\n',
      'a\r\nb\n',
      'LF file gained 1 CRLF line ending(s)',
    ],
    [
      'an LF file with one stray CRLF',
      'a\nb\r\nc\n',
      'a\nb\r\nc\nd\n',
      undefined,
    ],
    [
      'a tie read as CRLF',
      'a\r\nb\n',
      'a\r\nb\nc\n',
      'CRLF file gained 1 bare LF line ending(s)',
    ],
    [
      'a CRLF file that gained more CRLF',
      'a\r\n',
      'a\r\nb\r\n',
      undefined,
    ],
    [
      'no line endings',
      'a',
      'a',
      undefined,
    ],
  ])('judges %s', (_label, source, fixed, expected) => {
    const diff = endingsDiff(source, fixed);

    expect(diff).toBe(expected);
  });
});
