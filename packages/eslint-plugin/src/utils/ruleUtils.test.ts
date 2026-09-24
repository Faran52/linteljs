import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isDirective,
  mustFind,
  rangeOf,
} from './ruleUtils.ts';

import { sourceCodeFrom } from '#mocks/sourceCodeFrom';

// Both take the shape rather than RuleNode, so a degenerate argument here needs no cast.
const parsed = sourceCodeFrom([
  'const alpha = 1;',
  '',
  'const beta = (delta) => {',
  '  return delta;',
  '};',
  '',
].join('\n'));

describe('isDirective', () => {
  it('answers for a statement carrying a string directive', () => {
    expect(isDirective({
      type: 'ExpressionStatement',
      directive: 'use client',
    })).toBe(true);
  });

  // typescript-eslint's shape for `run();`: the key is present and undefined, so the key alone would answer wrongly.
  it('declines a statement whose directive key is undefined, or absent', () => {
    expect(isDirective({
      type: 'ExpressionStatement',
      directive: undefined,
    })).toBe(false);
    expect(isDirective({ type: 'VariableDeclaration' })).toBe(false);
  });
});

describe('mustFind', () => {
  it('hands back whatever the lookup found', () => {
    const identifier = parsed.firstNode('Identifier');

    expect(mustFind(parsed.sourceCode.getFirstToken(identifier), 'the first token').value).toBe('alpha');
  });

  // ESLint names the rule and the file; only the rule knows which of its lookups failed.
  it('names the plugin and the lookup when one comes back null', () => {
    expect(() => {
      return mustFind(null, 'the token before a comma');
    }).toThrow('@linteljs/eslint-plugin: the token before a comma was not found, which the parse promises. '
      + 'Please open an issue with the file and the parser it ran under.');
  });

  it('treats undefined, an index past a list, the same way', () => {
    const empty: string[] = [];

    expect(() => {
      return mustFind(empty.at(0), 'the first element');
    }).toThrow('the first element was not found');
  });
});

describe('rangeOf', () => {
  it('hands back the range a parsed node carries', () => {
    expect(rangeOf(parsed.firstNode('Identifier'))).toEqual([6, 11]);
  });

  it('names the plugin when a node carries none', () => {
    expect(() => {
      return rangeOf({});
    }).toThrow(/@linteljs\/eslint-plugin: a parsed node carries no range/);
  });
});
