import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { surfacesAnswer } from './surfacesAnswer';

describe('surfacesAnswer', () => {
  it('is keyed surfaces', () => {
    expect(surfacesAnswer.key).toBe('surfaces');
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

    const actual = surfacesAnswer.slot(webextension);
    expect(actual).toBe(true);
    const actual2 = surfacesAnswer.slot(react);
    expect(actual2).toBe(false);
  });
});
