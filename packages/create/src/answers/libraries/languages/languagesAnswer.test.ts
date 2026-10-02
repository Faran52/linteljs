import { LANGUAGES } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';
import { targetAnswer } from '../../target/target/targetAnswer';

import { languagesAnswer } from './languagesAnswer';

const TARGETS = valuesOf(targetAnswer.values);

describe('languagesAnswer', () => {
  it('is keyed languages and may be skipped', () => {
    expect(languagesAnswer.key).toBe('languages');
    expect(languagesAnswer.skippable).toBe(true);
  });

  it('offers every language a project can list, in its order', () => {
    const actual = Object.keys(languagesAnswer.values);
    expect(actual).toEqual(LANGUAGES);
  });

  it('takes a slot on every target, and on an extension only where a popup has text to translate', () => {
    const slotted = TARGETS
      .filter((target) => {
        return languagesAnswer.slot(targetFor({
          ...DEFAULT_ANSWERS,
          target,
        }));
      });
    const background = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      surfaces: ['background'],
    });

    expect(slotted).toEqual(TARGETS);
    const actual = languagesAnswer.slot(background);
    expect(actual).toBe(false);
  });
});
