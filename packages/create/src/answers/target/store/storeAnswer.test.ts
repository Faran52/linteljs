import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { storeAnswer } from './storeAnswer';

describe('storeAnswer', () => {
  it('is keyed store', () => {
    expect(storeAnswer.key).toBe('store');
  });

  it('takes a slot on a target that carries a store and on no other', () => {
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });
    const svelte = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'svelte',
    });

    expect(storeAnswer.slot(react)).toBe(true);
    expect(storeAnswer.slot(svelte)).toBe(false);
  });
});
