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

    const onExtension = surfacesAnswer.slot(webextension);
    expect(onExtension).toBe(true);
    const onReact = surfacesAnswer.slot(react);
    expect(onReact).toBe(false);
  });
});
