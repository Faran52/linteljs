import { valuesOf } from '@utils/objectUtils';

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
    const extension = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
    });

    expect(storeAnswer.slot(react)).toBe(true);
    expect(storeAnswer.slot(extension)).toBe(false);
  });

  it.each(valuesOf(storeAnswer.values))('offers %s only to a target that lists it', (store) => {
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    const listed = storeAnswer.values[store].only({
      ...react,
      stores: [store],
    });

    expect(listed).toBe(true);

    const unlisted = storeAnswer.values[store].only({
      ...react,
      stores: [],
    });

    expect(unlisted).toBe(false);
  });
});
