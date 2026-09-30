import { LANGUAGES } from '@config/constants';

import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { languagesAnswer } from './languagesAnswer';

describe('languagesAnswer', () => {
  it('is keyed languages and may be skipped', () => {
    expect(languagesAnswer.key).toBe('languages');
    expect(languagesAnswer.skippable).toBe(true);
  });

  it('offers every language a project can list, in its order', () => {
    expect(Object.keys(languagesAnswer.values)).toEqual(LANGUAGES);
  });

  it('takes a slot on a target that translates its starter and on no other', () => {
    const react = targetFor(DEFAULT_ANSWERS);
    const vue = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'vue',
    });

    expect(languagesAnswer.slot(react)).toBe(true);
    expect(languagesAnswer.slot(vue)).toBe(false);
  });
});
