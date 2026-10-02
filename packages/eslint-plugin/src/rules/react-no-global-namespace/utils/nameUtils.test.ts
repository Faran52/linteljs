import {
  describe,
  expect,
  it,
} from 'vitest';

import { nameOf } from './nameUtils.ts';

import type { NamedNode, TypedNode } from '../../../utils/ruleUtils.ts';

const named = (type: string, name: string): TypedNode & NamedNode => {
  const node = {
    type,
    name,
  };

  return node;
};

describe('nameOf', () => {
  it('reads the name an identifier carries', () => {
    const name = nameOf(named('Identifier', 'ReactNode'));
    expect(name).toBe('ReactNode');
  });

  it('reads the name a private identifier carries', () => {
    const name = nameOf(named('PrivateIdentifier', 'hidden'));
    expect(name).toBe('hidden');
  });

  it('answers nothing for a node carrying no name', () => {
    const name = nameOf({ type: 'Literal' });
    expect(name).toBeUndefined();
  });
});
