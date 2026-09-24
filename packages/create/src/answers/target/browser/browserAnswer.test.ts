import { targetFor } from '#targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { browserAnswer } from './browserAnswer';

describe('browserAnswer', () => {
  it('is keyed browser', () => {
    expect(browserAnswer.key).toBe('browser');
  });

  it('defaults to a value it offers', () => {
    expect(Object.keys(browserAnswer.values)).toContain(browserAnswer.default);
  });

  it('takes a slot on a target that hosts a browser and on no other', () => {
    const webextension = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
    });
    const react = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    expect(browserAnswer.slot(webextension)).toBe(true);
    expect(browserAnswer.slot(react)).toBe(false);
  });
});
