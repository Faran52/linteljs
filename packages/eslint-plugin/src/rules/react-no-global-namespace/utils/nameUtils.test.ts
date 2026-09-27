import {
  describe,
  expect,
  it,
} from 'vitest';

import { nameOf } from './nameUtils.ts';

import type { NamedNode, TypedNode } from '../../../utils/ruleUtils.ts';

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

  it('reads the name a private identifier carries', () => {
    expect(nameOf(named('PrivateIdentifier', 'hidden'))).toBe('hidden');
  });

  it('answers nothing for a node carrying no name', () => {
    expect(nameOf({ type: 'Literal' })).toBeUndefined();
  });
});
