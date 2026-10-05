import { keysOf } from '@utils/objectUtils';

import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { storeAnswer } from './storeAnswer';

const STORES = keysOf(storeAnswer.values);

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

    const onReact = storeAnswer.slot(react);
    expect(onReact).toBe(true);
    const onExtension = storeAnswer.slot(extension);
    expect(onExtension).toBe(false);
  });

  it.each(STORES)('offers %s only to a target that lists it', (store) => {
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
