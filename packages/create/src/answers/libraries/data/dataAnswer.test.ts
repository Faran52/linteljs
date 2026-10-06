import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { dataAnswer } from './dataAnswer';

describe('dataAnswer', () => {
  it('takes a slot on an app and not on a library', () => {
    const app = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });
    const library = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'typescript',
    });

    const onApp = dataAnswer.slot(app);
    expect(onApp).toBe(true);
    const onLibrary = dataAnswer.slot(library);
    expect(onLibrary).toBe(false);
  });

  it('is keyed data', () => {
    expect(dataAnswer.key).toBe('data');
  });

  it('offers rtk-query only beside the redux store', () => {
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    const withRedux = dataAnswer.values['rtk-query'].only(react, {
      ...DEFAULT_ANSWERS,
      store: 'redux-toolkit',
    });

    expect(withRedux).toBe(true);

    const withZustand = dataAnswer.values['rtk-query'].only(react, {
      ...DEFAULT_ANSWERS,
      store: 'zustand',
    });

    expect(withZustand).toBe(false);
  });
});
