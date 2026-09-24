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
    // The extension is the one target with none: MV3 state belongs in `chrome.storage`.
    const extension = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
    });

    expect(storeAnswer.slot(react)).toBe(true);
    expect(storeAnswer.slot(extension)).toBe(false);
  });
});
