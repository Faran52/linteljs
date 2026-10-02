import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { browsersAnswer } from './browsersAnswer';

describe('browsersAnswer', () => {
  it('is keyed browsers', () => {
    expect(browsersAnswer.key).toBe('browsers');
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

    const actual = browsersAnswer.slot(webextension);
    expect(actual).toBe(true);
    const actual2 = browsersAnswer.slot(react);
    expect(actual2).toBe(false);
  });
});
