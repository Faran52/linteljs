import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
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

    expect(mustFind(parsed.sourceCode.getFirstToken(identifier)).value).toBe('alpha');
  });

  it('names the plugin when a lookup comes back null', () => {
    expect(() => {
      return mustFind(null);
    }).toThrow(/@linteljs\/eslint-plugin: a lookup the parse guarantees came back empty/);
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
