import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { dataAnswer } from './dataAnswer';

describe('dataAnswer', () => {
  it('is keyed data', () => {
    expect(dataAnswer.key).toBe('data');
  });

  // RTK Query ships inside Redux Toolkit, so the store answer decides it and the target does not.
  it('offers rtk-query only beside the redux store', () => {
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    expect(dataAnswer.values['rtk-query'].only(react, {
      ...DEFAULT_ANSWERS,
      store: 'redux-toolkit',
    })).toBe(true);
    expect(dataAnswer.values['rtk-query'].only(react, {
      ...DEFAULT_ANSWERS,
      store: 'zustand',
    })).toBe(false);
  });
});
