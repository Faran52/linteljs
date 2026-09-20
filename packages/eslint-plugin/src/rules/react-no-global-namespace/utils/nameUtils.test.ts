import {
  describe,
  expect,
  it,
} from 'vitest';

import { nameOf } from './nameUtils.ts';

import type { NamedNode, TypedNode } from '../../../utils/ruleUtils.ts';

// Declared, because a bare literal with a `name` is an excess property against the parameter's own type.
const named = (type: string, name: string): TypedNode & NamedNode => {
  return {
    type,
    name,
  };
};

describe('nameOf', () => {
  it('reads the name an identifier carries', () => {
    expect(nameOf(named('Identifier', 'ReactNode'))).toBe('ReactNode');
  });

  // A private name is the other shape a non-computed member property takes, and it carries one too.
  it('reads the name a private identifier carries', () => {
    expect(nameOf(named('PrivateIdentifier', 'hidden'))).toBe('hidden');
  });

  /**
   * Unreachable through the rule, because a member property that is neither identifier is a computed access and the
   * visitor declines those first. Called directly so the arm is exercised rather than left to rot.
   */
  it('answers nothing for a node carrying no name', () => {
    expect(nameOf({ type: 'Literal' })).toBeUndefined();
  });
});
